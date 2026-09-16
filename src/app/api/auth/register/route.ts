import { pool } from '@/lib/db';
import { notificationDbService } from '@/modules/notifications/services/notification.service';
import { userDbService } from '@/modules/profile/services/user.service';
import { hashPassword, createSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      studentId,
      name,
      email,
      password,
      generationOptionId,
      provinceOptionId,
      studentStatus = 'studying',
      admissionYear,
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
    } = body;

    // ตรวจสอบความยินยอมที่จำเป็น
    if (!consentPdpa || !consentTerms || !consentVerification) {
      return NextResponse.json(
        { error: 'กรุณายอมรับข้อกำหนด นโยบายความเป็นส่วนตัว (PDPA) และการยินยอมตรวจสอบตัวตนก่อนลงทะเบียน' },
        { status: 400 }
      );
    }

    // ตรวจสอบฟิลด์ที่จำเป็น
    if (!studentId || !name || !email || !password || !generationOptionId || !provinceOptionId) {
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

    // ตรวจสอบรุ่นอัตโนมัติจากรหัสนักศึกษา 2 หลักแรก (เช่น 66 -> 66 - 37 = รุ่น 29)
    let resolvedGenerationId = parseInt(generationOptionId, 10);
    const matchPrefix = trimmedStudentId.match(/^([0-9]{2})/);
    if (matchPrefix) {
      const prefixNum = parseInt(matchPrefix[1], 10);
      const calculatedGen = prefixNum - 37;
      if (calculatedGen >= 1) {
        const { rows: autoGenRows } = await pool.query(
          `SELECT id FROM lookup_options WHERE category = 'generation' AND code = $1 LIMIT 1`,
          [`gen-${calculatedGen}`]
        );
        if (autoGenRows.length > 0) {
          resolvedGenerationId = autoGenRows[0].id;
        }
      }
    }

    // คำนวณปีที่คาดว่าจะสำเร็จการศึกษา
    let expectedGradYear = null;
    let actualStatus = studentStatus;
    const currentYearCE = new Date().getFullYear(); // e.g. 2026
    const currentYearBE = currentYearCE + 543;       // e.g. 2569

    const parsedAdmissionYear = admissionYear ? parseInt(String(admissionYear), 10) : null;
    if (parsedAdmissionYear) {
      expectedGradYear = parsedAdmissionYear + 4;
      // ถ้าครบ 4 ปีแล้วตามปีปัจจุบัน ให้เป็นศิษย์เก่าอัตโนมัติ
      if (parsedAdmissionYear <= currentYearCE - 4 || parsedAdmissionYear <= currentYearBE - 4) {
        actualStatus = 'alumni';
      }
    } else if (matchPrefix) {
      // ตรวจสอบจากรหัสนักศึกษา 2 หลักแรก เช่น 65 -> 2565 -> 2569 ครบ 4 ปี
      const prefixYearBE = 2500 + parseInt(matchPrefix[1], 10);
      expectedGradYear = prefixYearBE + 4;
      if (prefixYearBE + 4 <= currentYearBE) {
        actualStatus = 'alumni';
      }
    }

    // ข้อมูลศิษย์เก่า (ถ้ามีระบุ)
    const cleanCompany = company ? String(company).trim() : null;
    const cleanPosition = position ? String(position).trim() : null;
    const parsedCareerId = careerOptionId ? parseInt(String(careerOptionId), 10) : null;
    const parsedWorkProvinceId = workProvinceId ? parseInt(String(workProvinceId), 10) : parseInt(provinceOptionId, 10);
    const cleanBio = bio ? String(bio).trim() : null;
    const cleanAvatarUrl = body.avatarUrl || body.avatar_url || null;
    const isMentorship = Boolean(body.isAvailableForMentorship || body.is_available_for_mentorship);
    const showHometown = body.showHometownOnMap !== undefined ? Boolean(body.showHometownOnMap) : true;
    const showWorkplace = body.showWorkplaceOnMap !== undefined ? Boolean(body.showWorkplaceOnMap) : true;

    // บันทึกลงฐานข้อมูล users ด้วยสถานะ approved เพื่อให้พร้อมใช้งานทันที
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
        role,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'alumni', 'approved')
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
        parsedAdmissionYear || (matchPrefix ? 2500 + parseInt(matchPrefix[1], 10) : null),
        expectedGradYear,
        cleanCompany,
        cleanPosition,
        parsedCareerId,
        parsedWorkProvinceId,
        showWorkplace,
        cleanBio,
        isMentorship,
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

    // ตรวจสอบเลื่อนสถานะ 4 ปีระบบรวม
    try {
      await userDbService.promoteEligibleStudentsToAlumni();
    } catch {}

    // สร้าง Session และตั้งค่า Cookie ทันทีเพื่อให้ผู้ใช้สามารถเข้าสู่ระบบและใช้งานหน้าเว็บได้ทันที
    let sessionId: string | null = null;
    try {
      sessionId = await createSession(newUser.id);
      const cookieStore = await cookies();
      cookieStore.set('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    } catch (sessionErr) {
      console.error('[Register] Error setting auto-session cookie:', sessionErr);
    }

    return NextResponse.json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ! บัญชีของคุณได้รับการอนุมัติและพร้อมเข้าใช้งานระบบทันที',
      sessionId,
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
      { error: err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน' },
      { status: 500 }
    );
  }
}
