import { pool } from '@/lib/db';

export interface UserProfileData {
  id: number;
  studentId: string | null;
  email: string;
  name: string;
  nickname: string | null;
  role: string;
  status: string;
  studentStatus: string;
  totalPoints: number;
  avatarUrl: string | null;
  company: string | null;
  position: string | null;
  bio: string | null;
  generation: string | null;
  generationOptionId: number | null;
  province: string | null;
  provinceOptionId: number | null;
  workProvince: string | null;
  workProvinceId: number | null;
  careerType: string | null;
  careerOptionId: number | null;
  showHometownOnMap: boolean;
  showWorkplaceOnMap: boolean;
  isAvailableForMentorship: boolean;
  birthDate: string | null;
  createdAt: string;
}

export interface ActivityLogEntry {
  id: number;
  points: number;
  reason: string;
  description: string;
  createdAt: string;
}

export class UserDbService {
  /**
   * ดึงข้อมูลโปรไฟล์ผู้ใช้ตาม ID
   */
  async getUserProfile(userId: number): Promise<UserProfileData | null> {
    const { rows } = await pool.query(`
      SELECT
        u.id, u.student_id, u.email, u.name, u.nickname, u.role, u.status, u.student_status,
        u.total_points, u.avatar_url, u.company, u.position, u.bio,
        u.show_hometown_on_map, u.show_workplace_on_map, u.is_available_for_mentorship, u.birth_date, u.created_at,
        u.generation_option_id, u.province_option_id, u.work_province_id, u.career_option_id,
        gen.label as generation,
        prov.label as province,
        work_prov.label as work_province,
        ct.label as career_type
      FROM users u
      LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
      LEFT JOIN lookup_options prov ON prov.id = u.province_option_id
      LEFT JOIN lookup_options work_prov ON work_prov.id = u.work_province_id
      LEFT JOIN lookup_options ct ON ct.id = u.career_option_id
      WHERE u.id = $1
    `, [userId]);

    if (rows.length === 0) return null;
    const r = rows[0];

    return {
      id: r.id,
      studentId: r.student_id,
      email: r.email,
      name: r.name,
      nickname: r.nickname,
      role: r.role,
      status: r.status,
      studentStatus: r.student_status,
      totalPoints: r.total_points,
      avatarUrl: r.avatar_url,
      company: r.company,
      position: r.position,
      bio: r.bio,
      generation: r.generation,
      generationOptionId: r.generation_option_id,
      province: r.province,
      provinceOptionId: r.province_option_id,
      workProvince: r.work_province,
      workProvinceId: r.work_province_id,
      careerType: r.career_type,
      careerOptionId: r.career_option_id,
      showHometownOnMap: r.show_hometown_on_map,
      showWorkplaceOnMap: r.show_workplace_on_map,
      isAvailableForMentorship: Boolean(r.is_available_for_mentorship),
      birthDate: r.birth_date,
      createdAt: r.created_at,
    };
  }

  /**
   * ดึงประวัติกิจกรรมและแต้มสะสมของผู้ใช้
   */
  async getActivityLogs(userId: number): Promise<ActivityLogEntry[]> {
    const { rows } = await pool.query(`
      SELECT id, points, reason, created_at
      FROM point_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 30
    `, [userId]);

    return rows.map((r) => {
      let desc = 'ได้รับคะแนนกิจกรรม';
      if (r.reason === 'comment_post') desc = 'แสดงความคิดเห็นในโพสต์ (+1 แต้ม)';
      else if (r.reason === 'like_post') desc = 'ถูกใจโพสต์ในกระดานข่าวสาร (+1 แต้ม)';
      else if (r.reason === 'vote_poll') desc = 'ร่วมโหวตโพลสำรวจความคิดเห็น (+5 แต้ม)';
      else if (r.reason === 'hof_vote') desc = 'ร่วมโหวตศิษย์เก่าดีเด่น Hall of Fame';
      else if (r.reason === 'unlock_photo') desc = 'ตอบคำถามปลดล็อกภาพถ่ายความทรงจำ (+5 แต้ม)';

      return {
        id: r.id,
        points: r.points,
        reason: r.reason,
        description: desc,
        createdAt: r.created_at,
      };
    });
  }

  /**
   * อัปเดตการตั้งค่าความเป็นส่วนตัวบนแผนที่
   */
  async updatePrivacySettings(
    userId: number,
    settings: { showHometownOnMap: boolean; showWorkplaceOnMap: boolean }
  ) {
    await pool.query(`
      UPDATE users
      SET show_hometown_on_map = $1,
          show_workplace_on_map = $2
      WHERE id = $3
    `, [settings.showHometownOnMap, settings.showWorkplaceOnMap, userId]);

    return { success: true };
  }

  /**
   * อัปเดตข้อมูลโปรไฟล์ทั่วไป
   */
  async updateProfile(
    userId: number,
    data: {
      name?: string;
      nickname?: string;
      position?: string;
      company?: string;
      bio?: string;
      avatarUrl?: string;
      generation?: string;
      generationOptionId?: number | string;
      provinceOptionId?: number | string;
      workProvinceId?: number | string;
      careerOptionId?: number | string;
      isAvailableForMentorship?: boolean;
      birthDate?: string;
      yearbookPublished?: boolean;
    }
  ) {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.nickname !== undefined) {
      updates.push(`nickname = $${idx++}`);
      values.push(data.nickname);
    }
    if (data.position !== undefined) {
      updates.push(`position = $${idx++}`);
      values.push(data.position);
    }
    if (data.company !== undefined) {
      updates.push(`company = $${idx++}`);
      values.push(data.company);
    }
    if (data.bio !== undefined) {
      updates.push(`bio = $${idx++}`);
      values.push(data.bio);
    }
    if (data.avatarUrl !== undefined) {
      updates.push(`avatar_url = $${idx++}`);
      values.push(data.avatarUrl);
    }
    if (data.birthDate !== undefined) {
      updates.push(`birth_date = $${idx++}`);
      values.push(data.birthDate || null);
    }
    if (data.yearbookPublished !== undefined) {
      updates.push(`yearbook_published = $${idx++}`);
      values.push(Boolean(data.yearbookPublished));
    }
    const mentorshipVal = data.isAvailableForMentorship !== undefined ? data.isAvailableForMentorship : (data as any).is_available_for_mentorship;
    if (mentorshipVal !== undefined) {
      updates.push(`is_available_for_mentorship = $${idx++}`);
      values.push(Boolean(mentorshipVal));
    }
    if (data.generationOptionId !== undefined) {
      updates.push(`generation_option_id = $${idx++}`);
      values.push(Number(data.generationOptionId));
    } else if (data.generation !== undefined) {
      // เลือกได้เฉพาะรุ่นที่มีข้อมูลจริงใน lookup_options เท่านั้น (ฝั่ง frontend ดึงตัวเลือก
      // จากที่นี่โดยตรงแล้ว) ถ้าไม่เจอแปลว่าไม่มีรุ่นนั้นจริงในระบบ ก็ไม่ต้องอัปเดต
      const genRes = await pool.query(
        `SELECT id FROM lookup_options WHERE category = 'generation' AND label = $1 LIMIT 1`,
        [data.generation]
      );
      if (genRes.rows.length > 0) {
        updates.push(`generation_option_id = $${idx++}`);
        values.push(genRes.rows[0].id);
      }
    }
    if (data.provinceOptionId !== undefined) {
      // จังหวัดภูมิลำเนา: อัปเดตทั้ง province_option_id และ hometown_province_id
      // ให้ตรงกัน ตามรูปแบบเดียวกับตอนสมัครสมาชิก (src/app/api/auth/register/route.ts)
      const provinceId = Number(data.provinceOptionId);
      updates.push(`province_option_id = $${idx++}`);
      values.push(provinceId);
      updates.push(`hometown_province_id = $${idx++}`);
      values.push(provinceId);
    }
    if (data.workProvinceId !== undefined) {
      updates.push(`work_province_id = $${idx++}`);
      values.push(Number(data.workProvinceId));
    }
    if (data.careerOptionId !== undefined) {
      updates.push(`career_option_id = $${idx++}`);
      values.push(Number(data.careerOptionId));
    }

    if (updates.length === 0) return { success: true };

    values.push(userId);
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`,
      values
    );

    return { success: true };
  }

  /** ดึง user ตาม id พร้อม join labels (ใช้ใน feed/delete เพื่อตรวจสอบสิทธิ์ admin) */
  async getUserById(userId: number) {
    const { rows } = await pool.query(
      `SELECT u.*,
              gen.label  AS generation,
              prov.label AS province,
              ct.label   AS career_type
       FROM users u
       LEFT JOIN lookup_options gen  ON gen.id  = u.generation_option_id
       LEFT JOIN lookup_options prov ON prov.id = u.province_option_id
       LEFT JOIN lookup_options ct   ON ct.id   = u.career_option_id
       WHERE u.id = $1`,
      [userId]
    );
    return rows[0] ?? null;
  }

  /** ดึงประวัติกิจกรรมของผู้ใช้ (รูปแบบข้อความสำเร็จรูป ใช้ใน /api/user/activity) */
  async getActivityLog(userId: number) {
    const { rows } = await pool.query(
      `
      select description, points, created_at from (
        select ('คอมเมนต์: ' || left(content, 40)) as description, points_earned as points, created_at
        from post_interactions where user_id = $1 and type = 'comment'
        union all
        select ('โหวตโพล: ' || (select question from polls where id = poll_votes.poll_id)) as description, points_awarded as points, voted_at as created_at
        from poll_votes where user_id = $1
        union all
        select ('โหวต Hall of Fame (' ||
          case vote_category when 'same_generation' then 'ในรุ่น' else 'นอกรุ่น' end || ')') as description,
          points, voted_at as created_at
        from hof_votes where voter_id = $1
        union all
        select 'ตอบคำถามปลดล็อกรูปเก่าสำเร็จ' as description, points_earned as points, verified_at as created_at
        from photo_view_verifications where user_id = $1 and is_passed = true
      ) activity
      order by created_at desc
      `,
      [userId]
    );
    return rows;
  }

  /** ดึงรูปภาพที่ผู้ใช้ถูกแท็กจริงจากตาราง photo_tags (ใช้ใน /api/user/photos) */
  async getUserTaggedPhotos(userId: number) {
    const { rows } = await pool.query(
      `SELECT
         pt.id as tag_id,
         pt.tag_source,
         ma.id,
         ma.image_url,
         ma.watermark_url,
         ma.caption,
         gen.label as generation,
         u_by.name as tagged_by_name
       FROM photo_tags pt
       JOIN media_assets ma ON ma.id = pt.asset_id
       LEFT JOIN lookup_options gen ON gen.id = ma.generation_option_id
       LEFT JOIN users u_by ON u_by.id = pt.tagged_by
       WHERE pt.tagged_user_id = $1
       ORDER BY pt.id DESC`,
      [userId]
    );
    return rows.map((r) => ({
      id: r.id,
      tag_id: r.tag_id,
      image_url: r.image_url,
      watermark_url: r.watermark_url,
      caption: r.caption || 'รูปภาพกิจกรรม',
      generation: r.generation,
      tagged_by_name: r.tagged_by_name,
    }));
  }

  /** ดึงรูปภาพที่ผู้ใช้ปลดล็อกจากการตอบคำถามจริงจาก photo_view_verifications (ใช้ใน /api/user/photos) */
  async getUserUnlockedPhotos(userId: number) {
    const { rows } = await pool.query(
      `SELECT
         pv.id as verification_id,
         pv.verified_at,
         ma.id,
         ma.image_url,
         ma.watermark_url,
         ma.caption,
         gen.label as generation
       FROM photo_view_verifications pv
       JOIN media_assets ma ON ma.id = pv.asset_id
       LEFT JOIN lookup_options gen ON gen.id = ma.generation_option_id
       WHERE pv.user_id = $1 AND pv.is_passed = true
       ORDER BY pv.verified_at DESC`,
      [userId]
    );
    return rows.map((r) => ({
      id: r.id,
      image_url: r.image_url,
      watermark_url: r.watermark_url,
      caption: r.caption || 'รูปภาพที่ปลดล็อก',
      generation: r.generation,
      verified_at: r.verified_at,
    }));
  }

  /**
   * เลื่อนสถานะนักศึกษาปัจจุบัน (studying) เป็นศิษย์เก่า (alumni) อัตโนมัติ
   * ถ้าครบ 4 ปีตามปีปัจจุบัน (ใช้ใน auth/register และ member.service หลังอนุมัติผู้ใช้)
   */
  async promoteEligibleStudentsToAlumni(): Promise<number> {
    const currentYearCE = new Date().getFullYear();
    const currentYearBE = currentYearCE + 543;

    const { rowCount } = await pool.query(
      `UPDATE users
       SET student_status = 'alumni'
       WHERE student_status = 'studying'
         AND (
           (expected_graduation_year IS NOT NULL AND (expected_graduation_year <= $1 OR expected_graduation_year <= $2))
           OR
           (admission_year IS NOT NULL AND (admission_year <= ($1 - 4) OR admission_year <= ($2 - 4)))
           OR
           (
             student_id ~ '^[0-9]{2}' AND
             (2500 + substring(student_id from 1 for 2)::int + 4) <= $2
           )
         )`,
      [currentYearCE, currentYearBE]
    );

    return rowCount ?? 0;
  }

  // ---------------------------------------------------------------
  // ฟังก์ชันด้านล่างย้ายมาจาก src/lib/db.ts (god-file) — ปัจจุบันไม่มี route ใดเรียกใช้
  // คงไว้เพื่อรักษาพฤติกรรมเดิมทั้งหมด ไม่ได้ผูกกับ route ใดในตอนนี้
  // ---------------------------------------------------------------

  /** ดึงโปรไฟล์ตามรหัสนักศึกษา พร้อม gallery 3 รูปแรก (legacy, ยังไม่ได้ใช้งาน) */
  async getUserProfileByStudentIdLegacy(studentId: string) {
    const { rows } = await pool.query(
      `select u.*, gen.label as generation, prov.label as province, ct.label as career_type
       from users u
       left join lookup_options gen on gen.id = u.generation_option_id
       left join lookup_options prov on prov.id = u.province_option_id
       left join lookup_options ct on ct.id = u.career_option_id
       where u.student_id = $1`,
      [studentId]
    );
    if (rows.length === 0) return null;
    const user = rows[0];

    const { rows: gallery } = await pool.query(
      `select image_url from media_assets where owner_type = 'user_gallery' and owner_id = $1 order by sort_order limit 3`,
      [user.id]
    );

    return { ...user, galleryImages: gallery.map((g) => g.image_url) };
  }

  /** ดึงโปรไฟล์ตาม id พร้อม gallery 3 รูปแรก (legacy, ยังไม่ได้ใช้งาน) */
  async getUserProfileByIdLegacy(userId: number) {
    const { rows } = await pool.query(
      `select u.*, gen.label as generation, prov.label as province, ct.label as career_type
       from users u
       left join lookup_options gen on gen.id = u.generation_option_id
       left join lookup_options prov on prov.id = u.province_option_id
       left join lookup_options ct on ct.id = u.career_option_id
       where u.id = $1`,
      [userId]
    );
    if (rows.length === 0) return null;
    const user = rows[0];

    const { rows: gallery } = await pool.query(
      `select image_url from media_assets where owner_type = 'user_gallery' and owner_id = $1 order by sort_order limit 3`,
      [user.id]
    );

    return { ...user, galleryImages: gallery.map((g) => g.image_url) };
  }

  /** อัลบั้ม "รูปที่มีคุณ" รูปแบบเดิม (legacy, ยังไม่ได้ใช้งาน) */
  async getTaggedPhotosLegacy(userId: number) {
    const { rows } = await pool.query(`
      select ma.*, u.name as tagged_by_name
      from media_assets ma
      join photo_tags pt on pt.asset_id = ma.id
      left join users u on u.id = pt.tagged_by
      where pt.tagged_user_id = $1
      order by ma.created_at desc
    `, [userId]);
    return rows;
  }

  /** อัลบั้ม "รูปที่คุณตอบคำถาม" รูปแบบเดิม (legacy, ยังไม่ได้ใช้งาน) */
  async getUnlockedPhotosLegacy(userId: number) {
    const { rows } = await pool.query(`
      select ma.*
      from media_assets ma
      join photo_view_verifications pvv on pvv.asset_id = ma.id
      where pvv.user_id = $1 and pvv.is_passed = true
      order by pvv.verified_at desc
    `, [userId]);
    return rows;
  }

  /** เลื่อนสถานะผู้ใช้รายเดียวเมื่อครบ 4 ปี (legacy, ยังไม่ได้ใช้งาน — ถูกแทนที่ด้วย promoteEligibleStudentsToAlumni) */
  async checkAndPromoteToAlumniLegacy(userId: number) {
    const currentYear = new Date().getFullYear();
    const { rows } = await pool.query(
      `update users
       set student_status = 'alumni'
       where id = $1
         and student_status = 'studying'
         and expected_graduation_year is not null
         and expected_graduation_year <= $2
       returning id, student_status`,
      [userId, currentYear]
    );
    return rows[0] ?? null;
  }

  /** ดึงผู้ใช้ pending ทั้งหมด (legacy, ยังไม่ได้ใช้งาน — ถูกแทนที่ด้วย adminDbService.getPendingVerifications) */
  async getPendingUsersLegacy() {
    const { rows } = await pool.query(`
      select u.id, u.student_id, u.name, u.email, u.student_status, u.created_at,
        gen.label as generation,
        prov.label as province,
        (select v.status from user_verifications v
         where v.user_id = u.id and v.source = 'registrar_api'
         order by v.decided_at desc limit 1) as registrar_status
      from users u
      left join lookup_options gen on gen.id = u.generation_option_id
      left join lookup_options prov on prov.id = u.province_option_id
      where u.status = 'pending'
      order by u.created_at desc
    `);
    return rows;
  }

  /** รายชื่อผู้ใช้ที่ approved ทั้งหมด สำหรับ autocomplete แท็กเพื่อน (legacy, ยังไม่ได้ใช้งาน) */
  async getAllApprovedUsersLegacy() {
    const { rows } = await pool.query(`select id, name from users where status = 'approved' order by name`);
    return rows;
  }

  /** ดึงผู้ใช้ทั้งหมด พร้อม optional filter (legacy, ยังไม่ได้ใช้งาน) */
  async getAllUsersLegacy(opts?: { status?: 'pending' | 'approved' | 'rejected'; role?: 'alumni' | 'admin'; generationId?: number }) {
    const filters: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (opts?.status)       { filters.push(`u.status = $${i++}`);               params.push(opts.status); }
    if (opts?.role)         { filters.push(`u.role = $${i++}`);                 params.push(opts.role); }
    if (opts?.generationId) { filters.push(`u.generation_option_id = $${i++}`); params.push(opts.generationId); }

    const where = filters.length > 0 ? 'WHERE ' + filters.join(' AND ') : '';
    const { rows } = await pool.query(
      `SELECT u.id, u.student_id, u.name, u.email, u.role, u.status,
              u.total_points, u.student_status, u.created_at,
              gen.label AS generation
       FROM users u
       LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
       ${where}
       ORDER BY u.created_at DESC`,
      params
    );
    return rows;
  }

  /** ค้นหาศิษย์เก่าแบบ full-text (legacy, ยังไม่ได้ใช้งาน — ถูกแทนที่ด้วย alumniAggregator) */
  async searchAlumniLegacy(
    query: string,
    opts?: { generationId?: number; provinceId?: number; careerId?: number; limit?: number }
  ) {
    const searchTerm = `%${query}%`;
    const params: unknown[] = [searchTerm];
    const filters: string[] = [
      `(u.name ILIKE $1 OR u.company ILIKE $1 OR u.position ILIKE $1
        OR gen.label ILIKE $1 OR prov.label ILIKE $1)`,
    ];

    let i = 2;
    if (opts?.generationId) { filters.push(`u.generation_option_id = $${i++}`); params.push(opts.generationId); }
    if (opts?.provinceId)   { filters.push(`u.province_option_id = $${i++}`);   params.push(opts.provinceId); }
    if (opts?.careerId)     { filters.push(`u.career_option_id = $${i++}`);     params.push(opts.careerId); }

    const limit = opts?.limit ?? 50;
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.position, u.company, u.avatar_url, u.total_points,
              gen.label  AS generation,
              prov.label AS province,
              ct.label   AS career_type
       FROM users u
       LEFT JOIN lookup_options gen  ON gen.id  = u.generation_option_id
       LEFT JOIN lookup_options prov ON prov.id = u.province_option_id
       LEFT JOIN lookup_options ct   ON ct.id   = u.career_option_id
       WHERE u.status = 'approved' AND ${filters.join(' AND ')}
       ORDER BY u.total_points DESC, u.name
       LIMIT ${limit}`,
      params
    );
    return rows;
  }

  /** อัปเดต profile รูปแบบเดิม (legacy, ยังไม่ได้ใช้งาน — ถูกแทนที่ด้วย updateProfile) */
  async updateUserProfileLegacy(
    userId: number,
    data: {
      name?: string;
      company?: string;
      position?: string;
      bio?: string;
      avatar_url?: string;
      career_option_id?: number | null;
      province_option_id?: number | null;
      hometown_province_id?: number | null;
      work_province_id?: number | null;
      show_hometown_on_map?: boolean;
      show_workplace_on_map?: boolean;
    }
  ) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(data)) {
      if (val === undefined) continue;
      fields.push(`${key} = $${idx++}`);
      values.push(val);
    }
    if (fields.length === 0) return null;

    values.push(userId);
    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return rows[0] ?? null;
  }

  /** อัปเดต map privacy รูปแบบเดิม (legacy, ยังไม่ได้ใช้งาน — ถูกแทนที่ด้วย updatePrivacySettings) */
  async updateMapPrivacyLegacy(userId: number, opts: { showHometownOnMap?: boolean; showWorkplaceOnMap?: boolean }) {
    const fields: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (opts.showHometownOnMap  !== undefined) { fields.push(`show_hometown_on_map = $${i++}`);  params.push(opts.showHometownOnMap); }
    if (opts.showWorkplaceOnMap !== undefined) { fields.push(`show_workplace_on_map = $${i++}`); params.push(opts.showWorkplaceOnMap); }
    if (fields.length === 0) return null;

    params.push(userId);
    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${i}
       RETURNING id, show_hometown_on_map, show_workplace_on_map`,
      params
    );
    return rows[0] ?? null;
  }

  /** อัปเดต avatar_url (legacy, ยังไม่ได้ใช้งาน) */
  async updateAvatarLegacy(userId: number, avatarUrl: string) {
    const { rows } = await pool.query(
      `UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, avatar_url`,
      [avatarUrl, userId]
    );
    return rows[0] ?? null;
  }

  /** อนุมัติ user pending → approved (legacy, ยังไม่ได้ใช้งาน — ถูกแทนที่ด้วย adminDbService.decideUserVerification) */
  async approveUserLegacy(userId: number, adminId: number) {
    const { rows } = await pool.query(
      `UPDATE users SET status = 'approved'
       WHERE id = $1 AND status = 'pending'
       RETURNING id, name, status`,
      [userId]
    );
    if (rows.length > 0) {
      await pool.query(
        `INSERT INTO audit_logs (actor_id, action, target_type, target_id)
         VALUES ($1, 'approve_user', 'user', $2)`,
        [adminId, userId]
      );
      try {
        await this.promoteEligibleStudentsToAlumni();
      } catch {}
    }
    return rows[0] ?? null;
  }

  /** ปฏิเสธ user (legacy, ยังไม่ได้ใช้งาน) */
  async rejectUserLegacy(userId: number, adminId: number, remark?: string) {
    const { rows } = await pool.query(
      `UPDATE users SET status = 'rejected'
       WHERE id = $1 AND status = 'pending'
       RETURNING id, name, status`,
      [userId]
    );
    if (rows.length > 0) {
      await pool.query(
        `INSERT INTO audit_logs (actor_id, action, target_type, target_id, metadata)
         VALUES ($1, 'reject_user', 'user', $2, $3)`,
        [adminId, userId, JSON.stringify({ remark: remark ?? '' })]
      );
    }
    return rows[0] ?? null;
  }
}

export const userDbService = new UserDbService();
