import { pool } from '@/lib/db';
import { notificationDbService } from '@/modules/notifications/services/notification.service';
import { hashPassword } from '@/lib/auth';
import { publicErrorMessage } from '@/lib/api-error';
import { checkLength } from '@/lib/field-limits';
import { parseStudentId } from '@/lib/student-id';
import { normalizeAvatarInput } from '@/lib/upload-storage';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      studentId,
      name,
      email,
      password,
      // generationOptionId / admissionYear จาก client ไม่ใช้แล้ว — คำนวณจากรหัสนักศึกษาฝั่ง server เสมอ
      provinceOptionId,
      studentStatus = 'studying',
      showHometownOnMap = true,
      company,
      position,
      careerOptionId,
      workProvinceId,
      showWorkplaceOnMap = true,
      bio,
      consentPdpa,
      consentTerms,
      consentVerification,
      consentYearbook = true,
      consentCommunications = true,
      birthDate,
    } = body;

    // ตรวจสอบความยินยอมที่จำเป็น
    if (!consentPdpa || !consentTerms || !consentVerification) {
      return NextResponse.json(
        { error: 'กรุณายอมรับข้อกำหนด นโยบายความเป็นส่วนตัว (PDPA) และการยินยอมตรวจสอบตัวตนก่อนลงทะเบียน' },
        { status: 400 }
      );
    }

    // ตรวจสอบฟิลด์ที่จำเป็น
    if (!studentId || !name || !email || !password || !provinceOptionId) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' },
        { status: 400 }
      );
    }

    const trimmedStudentId = String(studentId).trim();
    const trimmedEmail = String(email).trim().toLowerCase();

    // รับรหัสนักศึกษาได้ทั้ง 8 หลัก (ระบบเดิม) และ 10 หลัก — สูตรคำนวณรุ่นต่างกัน ดู src/lib/student-id.ts
    const parsedId = parseStudentId(trimmedStudentId);
    if (!parsedId) {
      return NextResponse.json(
        { error: 'รหัสนักศึกษาต้องเป็นตัวเลข 8 หรือ 10 หลัก' },
        { status: 400 }
      );
    }

    const lengthError =
      checkLength(name, 'name', 'ชื่อ-นามสกุล') ||
      checkLength(email, 'email', 'อีเมล') ||
      checkLength(company, 'company', 'ชื่อบริษัท/องค์กร') ||
      checkLength(position, 'position', 'ตำแหน่งงาน') ||
      checkLength(bio, 'bio', 'คำแนะนำตัว') ||
      checkLength(body.facebookUrl, 'facebookUrl', 'Facebook') ||
      checkLength(body.lineId, 'lineId', 'LINE ID');
    if (lengthError) {
      return NextResponse.json({ error: lengthError }, { status: 400 });
    }

    // ตรวจสอบความซ้ำซ้อนของ student_id และ email
    const { rows: existing } = await pool.query(
      `SELECT id, student_id, email FROM users WHERE student_id = $1 OR email = $2`,
      [trimmedStudentId, trimmedEmail]
    );

    if (existing.length > 0) {
      const match = existing[0];
      if (match.student_id === trimmedStudentId) {
        return NextResponse.json(
          { error: 'รหัสนักศึกษานี้ได้ลงทะเบียนในระบบแล้ว' },
          { status: 409 }
        );
      }
      if (match.email === trimmedEmail) {
        return NextResponse.json(
          { error: 'อีเมลนี้ได้ลงทะเบียนในระบบแล้ว' },
          { status: 409 }
        );
      }
    }

    // เข้ารหัสรหัสผ่าน
    const passwordHash = await hashPassword(password);

    // คำนวณรุ่นอัตโนมัติจากรหัสนักศึกษา — เซิร์ฟเวอร์คำนวณเองเสมอ ไม่เชื่อ generationOptionId จาก client
    // (10 หลัก: 66xxxxxxxx → รุ่น 29, 8 หลัก: 47xxxxxx → รุ่น 30)
    const genNumber = parsedId.generationNumber;
    const genCode = `gen-${genNumber}`;
    let resolvedGenerationId: number;
    const { rows: autoGenRows } = await pool.query(
      `SELECT id FROM lookup_options WHERE category = 'generation' AND code = $1 LIMIT 1`,
      [genCode]
    );
    if (autoGenRows.length > 0) {
      resolvedGenerationId = autoGenRows[0].id;
    } else {
      // ยังไม่มีตัวเลือกรุ่นนี้ในระบบ (เช่นรุ่นใหม่ที่ยังไม่เคยมีใครสมัครมาก่อน) — สร้างให้เองทันที
      // แทนที่จะปล่อยให้สมัครไม่ได้แล้วต้องรอโปรแกรมเมอร์มา insert เพิ่มด้วยมือทุกปีไปตลอดกาล
      // ON CONFLICT กันแถวซ้ำกรณีมีคนรุ่นเดียวกันสมัครพร้อมกันหลายคน (race condition)
      const { rows: createdGenRows } = await pool.query(
        `INSERT INTO lookup_options (category, code, label, extra)
         VALUES ('generation', $1, $2, $3::jsonb)
         ON CONFLICT (category, code) DO UPDATE SET category = EXCLUDED.category
         RETURNING id`,
        [
          genCode,
          `รุ่น ${genNumber}`,
          JSON.stringify({
            prefix: String(genNumber + 37),
            gen_number: genNumber,
            entry_year_be: parsedId.entryYearBE,
            year_start: parsedId.entryYearBE - 543,
            year_end: parsedId.entryYearBE - 543 + 4,
          }),
        ]
      );
      resolvedGenerationId = createdGenRows[0].id;
    }

    // ปีเข้าศึกษา/ปีจบ คำนวณจากรุ่น (ไม่ใช่ 2500 + 2 หลักแรก ซึ่งผิดกับรหัส 8 หลัก) — ใช้แสดงผลเท่านั้น
    const parsedAdmissionYear = parsedId.entryYearBE;
    const expectedGradYear = parsedId.expectedGraduationYearBE;
    // สถานะใช้ตามที่ผู้ใช้เลือกเอง (บางคนเรียนเกิน 4 ปี — เปลี่ยนภายหลังได้ที่หน้าโปรไฟล์ "ฉันจบการศึกษาแล้ว")
    // ยกเว้นรหัส 8 หลัก (ระบบเดิม) เป็นศิษย์เก่าเสมอ — ปัจจุบันออกรหัสแค่ 10 หลัก
    const actualStatus = parsedId.length === 8 || studentStatus === 'alumni' ? 'alumni' : 'studying';

    // ข้อมูลศิษย์เก่า (ถ้ามีระบุ)
    const cleanCompany = company ? String(company).trim() : null;
    const cleanPosition = position ? String(position).trim() : null;
    const parsedCareerId = careerOptionId ? parseInt(String(careerOptionId), 10) : null;
    const parsedWorkProvinceId = workProvinceId ? parseInt(String(workProvinceId), 10) : parseInt(provinceOptionId, 10);
    const cleanBio = bio ? String(bio).trim() : null;
    // รูปที่อัปโหลด (data URL) → บันทึกเป็นไฟล์ แล้วเก็บแค่ path ลง DB
    let cleanAvatarUrl: string | null;
    try {
      cleanAvatarUrl = await normalizeAvatarInput(body.avatarUrl || body.avatar_url);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    const cleanBirthDate = birthDate ? String(birthDate).trim() : null;
    const cleanFacebookUrl = body.facebookUrl ? String(body.facebookUrl).trim() : null;
    const cleanLineId = body.lineId ? String(body.lineId).trim() : null;
    const isMentorship = Boolean(body.isAvailableForMentorship || body.is_available_for_mentorship);
    const showHometown = body.showHometownOnMap !== undefined ? Boolean(body.showHometownOnMap) : true;
    const showWorkplace = body.showWorkplaceOnMap !== undefined ? Boolean(body.showWorkplaceOnMap) : true;
    // การแสดงข้อมูลส่วนตัวรายฟิลด์ (ไอคอนเขียว/แดงในหน้าสมัคร) — ไม่ส่งมา = ปิด
    const showEmail = Boolean(body.showEmail);
    const showBirthDate = Boolean(body.showBirthDate);
    const showStudentIdFlag = Boolean(body.showStudentId);
    const showFacebook = Boolean(body.showFacebook);
    const showLineId = Boolean(body.showLineId);
    const showContactOnMap = showFacebook || showLineId;

    // บันทึกลงฐานข้อมูล users ด้วยสถานะ pending — ต้องให้เพื่อนร่วมรุ่นหรือแอดมินยืนยันตัวตนก่อน
    // (เดิมให้ approved ทันที ใครก็กรอกรหัสนักศึกษาของคนอื่นแล้วเข้าระบบได้เลย)
    const { rows: newUserRows } = await pool.query(
      `INSERT INTO users (
        student_id,
        name,
        email,
        password_hash,
        avatar_url,
        generation_option_id,
        province_option_id,
        hometown_province_id,
        show_hometown_on_map,
        student_status,
        admission_year,
        expected_graduation_year,
        company,
        position,
        career_option_id,
        work_province_id,
        show_workplace_on_map,
        bio,
        is_available_for_mentorship,
        birth_date,
        facebook_url,
        line_id,
        show_email,
        show_birth_date,
        show_student_id,
        show_facebook,
        show_line_id,
        show_contact_on_map,
        yearbook_published,
        role,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
                $22, $23, $24, $25, $26, $27, $28, 'alumni', 'pending')
      RETURNING id, student_id, name, email, student_status, generation_option_id, province_option_id, status`,
      [
        trimmedStudentId,
        name.trim(),
        trimmedEmail,
        passwordHash,
        cleanAvatarUrl,
        resolvedGenerationId,
        parseInt(provinceOptionId, 10),
        showHometown,
        actualStatus,
        parsedAdmissionYear,
        expectedGradYear,
        cleanCompany,
        cleanPosition,
        parsedCareerId,
        parsedWorkProvinceId,
        showWorkplace,
        cleanBio,
        isMentorship,
        cleanBirthDate,
        cleanFacebookUrl,
        cleanLineId,
        showEmail,
        showBirthDate,
        showStudentIdFlag,
        showFacebook,
        showLineId,
        showContactOnMap,
        // กรอก Bio มาตอนสมัคร = ตั้งใจให้แสดงในหนังสือรุ่น (หนังสือรุ่นแสดงเฉพาะบัญชีที่อนุมัติแล้ว)
        Boolean(cleanBio),
      ]
    );

    const newUser = newUserRows[0];

    // ดึงชื่อรุ่นสำหรับข้อความแจ้งเตือน
    const { rows: genRows } = await pool.query(
      `SELECT label FROM lookup_options WHERE id = $1`,
      [newUser.generation_option_id]
    );
    const genLabel = genRows[0]?.label;

    // 1. ส่ง Notification แจ้งเตือนไปยัง Admin
    try {
      await notificationDbService.notifyAdminNewRegistration(newUser.id, newUser.name, genLabel);
    } catch (e) {
      console.error('[Register] Error notifying admin:', e);
    }

    // 2. ส่ง Notification แจ้งเตือนไปยังเพื่อนร่วมรุ่นที่อนุมัติแล้ว
    try {
      await notificationDbService.notifyBatchmatesNewRegistration(
        newUser.generation_option_id,
        newUser.id,
        newUser.name,
        newUser.student_id
      );
    } catch (e) {
      console.error('[Register] Error notifying batchmates:', e);
    }

    // 3. บันทึกประวัติความยินยอม (Consent Audit Trail)
    try {
      await pool.query(
        `INSERT INTO audit_logs (actor_id, action, target_type, target_id, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          newUser.id,
          'USER_REGISTER_CONSENT',
          'user',
          newUser.id,
          JSON.stringify({
            consentPdpa: Boolean(consentPdpa),
            consentTerms: Boolean(consentTerms),
            consentVerification: Boolean(consentVerification),
            consentYearbook: Boolean(consentYearbook),
            consentCommunications: Boolean(consentCommunications),
            showHometownOnMap: Boolean(showHometownOnMap),
            showWorkplaceOnMap: Boolean(showWorkplaceOnMap),
            agreedAt: new Date().toISOString(),
          }),
        ]
      );
    } catch (e) {
      console.error('[Register] Error recording consent audit log:', e);
    }

    // ไม่สร้าง session ให้อัตโนมัติ — บัญชียัง pending อยู่ ต้องรอเพื่อนร่วมรุ่น/แอดมินยืนยันก่อน
    // แล้วค่อยล็อกอินเองที่หน้า /login (login route ปฏิเสธบัญชี pending อยู่แล้ว)
    return NextResponse.json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ! กรุณารอเพื่อนร่วมรุ่นหรือผู้ดูแลระบบยืนยันตัวตน แล้วจึงเข้าสู่ระบบ',
      user: {
        id: newUser.id,
        name: newUser.name,
        studentId: newUser.student_id,
        email: newUser.email,
        status: newUser.status,
        studentStatus: newUser.student_status,
      },
    });
  } catch (err: any) {
    console.error('[API /api/auth/register] Error:', err);
    return NextResponse.json(
      { error: publicErrorMessage(err, 'เกิดข้อผิดพลาดในการลงทะเบียน') },
      { status: 500 }
    );
  }
}
