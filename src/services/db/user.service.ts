import { pool } from '@/lib/db';

export interface UserProfileData {
  id: number;
  studentId: string | null;
  email: string;
  name: string;
  role: string;
  status: string;
  studentStatus: string;
  totalPoints: number;
  avatarUrl: string | null;
  company: string | null;
  position: string | null;
  bio: string | null;
  generation: string | null;
  province: string | null;
  careerType: string | null;
  showHometownOnMap: boolean;
  showWorkplaceOnMap: boolean;
  isAvailableForMentorship: boolean;
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
        u.id, u.student_id, u.email, u.name, u.role, u.status, u.student_status,
        u.total_points, u.avatar_url, u.company, u.position, u.bio,
        u.show_hometown_on_map, u.show_workplace_on_map, u.is_available_for_mentorship, u.created_at,
        gen.label as generation, 
        prov.label as province, 
        ct.label as career_type
      FROM users u
      LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
      LEFT JOIN lookup_options prov ON prov.id = u.province_option_id
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
      role: r.role,
      status: r.status,
      studentStatus: r.student_status,
      totalPoints: r.total_points,
      avatarUrl: r.avatar_url,
      company: r.company,
      position: r.position,
      bio: r.bio,
      generation: r.generation,
      province: r.province,
      careerType: r.career_type,
      showHometownOnMap: r.show_hometown_on_map,
      showWorkplaceOnMap: r.show_workplace_on_map,
      isAvailableForMentorship: Boolean(r.is_available_for_mentorship),
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
      position?: string;
      company?: string;
      bio?: string;
      avatarUrl?: string;
      generation?: string;
      isAvailableForMentorship?: boolean;
    }
  ) {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(data.name);
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
    const mentorshipVal = data.isAvailableForMentorship !== undefined ? data.isAvailableForMentorship : (data as any).is_available_for_mentorship;
    if (mentorshipVal !== undefined) {
      updates.push(`is_available_for_mentorship = $${idx++}`);
      values.push(Boolean(mentorshipVal));
    }
    if (data.generation !== undefined) {
      const genRes = await pool.query(
        `SELECT id FROM lookup_options WHERE category = 'generation' AND label = $1 LIMIT 1`,
        [data.generation]
      );
      if (genRes.rows.length > 0) {
        updates.push(`generation_option_id = $${idx++}`);
        values.push(genRes.rows[0].id);
      }
    }

    if (updates.length === 0) return { success: true };

    values.push(userId);
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`,
      values
    );

    return { success: true };
  }
}

export const userDbService = new UserDbService();
