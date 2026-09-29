import { pool } from '@/lib/db';

export interface AdminOverviewStats {
  totalAlumni: number;
  totalGenerations: number;
  outstandingAlumni: number;
  pendingApprovals: number;
  pendingPostRequests: number;
}

export interface PendingUserVerification {
  id: number;
  studentId: string | null;
  name: string;
  email: string;
  generation: string | null;
  province: string | null;
  status: string;
  createdAt: string;
}

export interface AdminMemberSummary {
  id: number;
  studentId: string | null;
  name: string;
  email: string;
  role: string;
  status: string;
  studentStatus: string | null;
  generation: string | null;
  province: string | null;
  careerType: string | null;
  company: string | null;
  position: string | null;
  avatarUrl: string | null;
  totalPoints: number;
  createdAt: string;
}

export interface PendingPostRequest {
  id: number;
  authorId: number;
  authorName: string;
  authorStudentId?: string;
  authorRole: string;
  title: string;
  body: string;
  category: string;
  postType?: 'normal' | 'poll';
  imageUrl?: string;
  createdAt: string;
  poll?: {
    id: number;
    question: string;
    pointsPerVote: number;
    options: { id: number; text: string }[];
  };
}

export class AdminDbService {
  /**
   * ดึงสถิติภาพรวมแดชบอร์ดผู้ดูแลระบบ
   */
  async getOverviewStats(): Promise<AdminOverviewStats> {
    try {
      const { rows: alumniCount } = await pool.query(
        `SELECT COUNT(*)::int as count FROM users WHERE role = 'alumni' AND status = 'approved'`
      );
      // เดิมนับ COUNT(*) ของ "ตัวเลือกรุ่น" ทั้งหมดใน dropdown สมัครสมาชิก (ปัจจุบัน 44 ตัวเลือก)
      // ซึ่งเป็นค่าคงที่ของ dropdown ไม่ใช่จำนวนรุ่นที่มีศิษย์เก่าจริงอยู่เลย — เปลี่ยนมานับจำนวน
      // รุ่นที่แตกต่างกันจริงจากศิษย์เก่าที่อนุมัติแล้วแทน ให้ตรงกับความหมายของป้าย "รุ่นศิษย์เก่าทั้งหมด"
      const { rows: genCount } = await pool.query(
        `SELECT COUNT(DISTINCT generation_option_id)::int as count
         FROM users WHERE status = 'approved' AND generation_option_id IS NOT NULL`
      );
      // เดิมนับ COUNT(*) ของ hof_candidates ทุกแคมเปญสะสมตลอดกาล ซึ่งมีแต่จะโตขึ้นเรื่อยๆ ไม่เคย
      // ลดลง และไม่ได้แปลว่า "ดีเด่น/ชนะแล้ว" จริง (ระบบนี้ไม่มีสถานะผู้ชนะเลย) — จำกัดเฉพาะ
      // แคมเปญล่าสุดแทน ให้สื่อถึง "ผู้เข้าชิงรอบปัจจุบัน" ซึ่งมีความหมายและเปลี่ยนแปลงตามจริง
      const { rows: candidateCount } = await pool.query(
        `SELECT COUNT(*)::int as count FROM hof_candidates
         WHERE campaign_id = (SELECT id FROM hof_campaigns ORDER BY id DESC LIMIT 1)`
      );
      const { rows: pendingUsers } = await pool.query(
        `SELECT COUNT(*)::int as count FROM users WHERE status = 'pending'`
      );
      const { rows: pendingPosts } = await pool.query(
        `SELECT COUNT(*)::int as count FROM posts WHERE status IN ('pending', 'pending_request')`
      );

      return {
        totalAlumni: alumniCount[0]?.count || 0,
        totalGenerations: genCount[0]?.count || 0,
        outstandingAlumni: candidateCount[0]?.count || 0,
        pendingApprovals: pendingUsers[0]?.count || 0,
        pendingPostRequests: pendingPosts[0]?.count || 0,
      };
    } catch (err) {
      console.error('[AdminDbService] getOverviewStats error:', err);
      return {
        totalAlumni: 0,
        totalGenerations: 0,
        outstandingAlumni: 0,
        pendingApprovals: 0,
        pendingPostRequests: 0,
      };
    }
  }

  /**
   * ดึงรายการผู้ใช้ที่รอการอนุมัติ
   */
  async getPendingVerifications(): Promise<PendingUserVerification[]> {
    try {
      const { rows } = await pool.query(`
        SELECT 
          u.id, u.student_id, u.name, u.email, u.status, u.created_at,
          gen.label as generation, prov.label as province
        FROM users u
        LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
        LEFT JOIN lookup_options prov ON prov.id = u.province_option_id
        WHERE u.status = 'pending'
        ORDER BY u.created_at ASC
      `);

      return rows.map((r) => ({
        id: r.id,
        studentId: r.student_id,
        name: r.name,
        email: r.email,
        generation: r.generation,
        province: r.province,
        status: r.status,
        createdAt: r.created_at,
      }));
    } catch (err) {
      console.error('[AdminDbService] getPendingVerifications error:', err);
      return [];
    }
  }

  /**
   * ดึงรายชื่อสมาชิกทั้งหมดในระบบ (ทุกสถานะ) สำหรับหน้าจัดการระบบของแอดมิน
   */
  async getAllUsers(): Promise<AdminMemberSummary[]> {
    try {
      const { rows } = await pool.query(`
        SELECT
          u.id, u.student_id, u.name, u.email, u.role, u.status, u.student_status,
          u.company, u.position, u.avatar_url, u.total_points, u.created_at,
          gen.label as generation, prov.label as province, ct.label as career_type
        FROM users u
        LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
        LEFT JOIN lookup_options prov ON prov.id = u.province_option_id
        LEFT JOIN lookup_options ct ON ct.id = u.career_option_id
        ORDER BY u.created_at DESC
      `);

      return rows.map((r) => ({
        id: r.id,
        studentId: r.student_id,
        name: r.name,
        email: r.email,
        role: r.role,
        status: r.status,
        studentStatus: r.student_status,
        generation: r.generation,
        province: r.province,
        careerType: r.career_type,
        company: r.company,
        position: r.position,
        avatarUrl: r.avatar_url,
        totalPoints: r.total_points,
        createdAt: r.created_at,
      }));
    } catch (err) {
      console.error('[AdminDbService] getAllUsers error:', err);
      return [];
    }
  }

  /**
   * ลบสมาชิกออกจากระบบ พร้อมล้างข้อมูลทั้งหมดที่ผูกกับสมาชิกคนนั้น
   * (โพสต์ที่ขอลง, คอมเมนต์/ปฏิกิริยา, โหวตโพล, การเป็นผู้สมัคร/โหวต HOF,
   *  รูปที่อัปโหลด, การถูกแท็ก/แท็กผู้อื่นในรูป, ประวัติปลดล็อกรูป)
   * ส่วนข้อมูลของ "คนอื่น" ที่แค่มีสมาชิกคนนี้เป็นแอดมินผู้อนุมัติ จะแค่ล้างอ้างอิง (set null)
   * ไม่ลบข้อมูลของคนอื่นทิ้งไปด้วย
   */
  async deleteUser(userId: number, actorId?: number): Promise<{ success: boolean; error?: string }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // เก็บชื่อไว้ก่อนลบ เพื่อบันทึกลง audit log — หลังลบแล้ว user row จะหายไป join หาชื่อย้อนหลังไม่ได้
      const { rows: targetRows } = await client.query(`SELECT name, student_id FROM users WHERE id = $1`, [userId]);
      const targetName = targetRows[0]?.name || null;

      // ล้างอ้างอิงที่สมาชิกคนนี้เป็นเพียง "ผู้ดำเนินการ" ให้คนอื่น — ไม่ลบข้อมูลของคนอื่น
      await client.query(`UPDATE posts SET admin_id = NULL WHERE admin_id = $1`, [userId]);
      await client.query(`UPDATE user_verifications SET admin_id = NULL WHERE admin_id = $1`, [userId]);

      // ลบโพสต์ที่สมาชิกคนนี้ร้องขอเอง (ลบโพลของโพสต์ก่อน เพราะไม่มี cascade จาก posts)
      await client.query(
        `DELETE FROM polls WHERE post_id IN (SELECT id FROM posts WHERE requested_by = $1)`,
        [userId]
      );
      await client.query(`DELETE FROM posts WHERE requested_by = $1`, [userId]);

      // ลบกิจกรรมของสมาชิกคนนี้บนโพสต์/โพลของคนอื่น
      await client.query(`DELETE FROM post_interactions WHERE user_id = $1`, [userId]);
      await client.query(`DELETE FROM poll_votes WHERE user_id = $1`, [userId]);
      await client.query(`DELETE FROM hof_votes WHERE voter_id = $1`, [userId]);

      // ลบการเป็นผู้สมัคร HOF ของสมาชิกคนนี้ (cascade ลบโหวตที่ตนเองได้รับไปด้วย)
      await client.query(`DELETE FROM hof_candidates WHERE user_id = $1`, [userId]);

      // ลบรูปที่อัปโหลด (cascade ลบแท็ก/ประวัติปลดล็อกของรูปนั้นไปด้วย) และแท็กที่เกี่ยวข้องกับตัวเอง
      await client.query(`DELETE FROM media_assets WHERE uploaded_by = $1`, [userId]);
      await client.query(
        `DELETE FROM photo_tags WHERE tagged_user_id = $1 OR tagged_by = $1`,
        [userId]
      );
      await client.query(`DELETE FROM photo_view_verifications WHERE user_id = $1`, [userId]);

      // ลบประวัติการยืนยันตัวตนของสมาชิกคนนี้เอง
      await client.query(`DELETE FROM user_verifications WHERE user_id = $1`, [userId]);

      const { rowCount } = await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
      if (!rowCount) {
        await client.query('ROLLBACK');
        return { success: false, error: 'ไม่พบสมาชิกที่ต้องการลบ' };
      }

      if (actorId) {
        try {
          await client.query(
            `INSERT INTO audit_logs (actor_id, action, target_type, target_id, metadata)
             VALUES ($1, 'delete_user', 'user', $2, $3)`,
            [actorId, userId, JSON.stringify({ name: targetName, studentId: targetRows[0]?.student_id || null })]
          );
        } catch {
          // บันทึกประวัติไม่สำเร็จ ไม่ใช่เหตุผลให้ยกเลิกการลบที่ทำสำเร็จแล้ว
        }
      }

      await client.query('COMMIT');
      return { success: true };
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('[AdminDbService] deleteUser error:', err);
      return { success: false, error: 'เกิดข้อผิดพลาดในการลบสมาชิก' };
    } finally {
      client.release();
    }
  }

  /**
   * อนุมัติ หรือ ปฏิเสธผู้ใช้งาน
   */
  async decideUserVerification(
    userId: number,
    adminId: number,
    decision: 'approved' | 'rejected',
    remark?: string
  ) {
    try {
      const { rows } = await pool.query(
        `UPDATE users SET status = $1 WHERE id = $2 RETURNING id, name, status`,
        [decision, userId]
      );

      try {
        await pool.query(
          `INSERT INTO audit_logs (actor_id, action, target_type, target_id, metadata)
           VALUES ($1, $2, 'user', $3, $4)`,
          [
            adminId,
            decision === 'approved' ? 'approve_user' : 'reject_user',
            userId,
            JSON.stringify({ remark: remark || '' }),
          ]
        );
      } catch {}

      return rows[0] || null;
    } catch (err) {
      console.error('[AdminDbService] decideUserVerification error:', err);
      return null;
    }
  }

  /**
   * ดึงโพสต์ที่เผยแพร่แล้วเพื่อให้แอดมินจัดการ (ลบ) — เรียงล่าสุดก่อน
   */
  async getPendingPostRequests(): Promise<PendingPostRequest[]> {
    try {
      const { rows: posts } = await pool.query(`
        SELECT 
          p.id, p.title, p.content as body, p.category, p.post_type, p.created_at,
          COALESCE(u.id, 1) as author_id,
          COALESCE(u.name, 'ศิษย์เก่า') as author_name,
          u.student_id as author_student_id,
          COALESCE(u.role, 'alumni') as author_role
        FROM posts p
        LEFT JOIN users u ON u.id = p.requested_by
        WHERE p.status = 'published'
        ORDER BY p.created_at DESC
        LIMIT 100
      `);

      const postIds = posts.map((p) => p.id);
      if (postIds.length === 0) return [];

      const { rows: polls } = await pool.query(
        `SELECT pl.id, pl.post_id, pl.question, pl.points_per_vote
         FROM polls pl
         WHERE pl.post_id = ANY($1::int[])`,
        [postIds]
      );

      const pollIds = polls.map((pl) => pl.id);
      let pollOptions: any[] = [];
      if (pollIds.length > 0) {
        const { rows: opts } = await pool.query(
          `SELECT po.id, po.poll_id, po.option_text as text
           FROM poll_options po
           WHERE po.poll_id = ANY($1::int[])
           ORDER BY po.id ASC`,
          [pollIds]
        );
        pollOptions = opts;
      }

      return posts.map((r) => {
        const poll = polls.find((pl) => pl.post_id === r.id);
        let pollData = undefined;
        if (poll) {
          const options = pollOptions.filter((opt) => opt.poll_id === poll.id);
          pollData = {
            id: poll.id,
            question: poll.question,
            pointsPerVote: poll.points_per_vote || 5,
            options,
          };
        }

        return {
          id: r.id,
          authorId: r.author_id,
          authorName: r.author_name,
          authorStudentId: r.author_student_id,
          authorRole: r.author_role,
          title: r.title,
          body: r.body,
          category: r.category,
          postType: r.post_type === 'poll' ? 'poll' : 'normal',
          createdAt: r.created_at,
          poll: pollData,
        };
      });
    } catch (err) {
      console.error('[AdminDbService] getPendingPostRequests error:', err);
      return [];
    }
  }

  /**
   * อนุมัติ หรือ ปฏิเสธโพสต์
   */
  async decidePostRequest(
    postId: number,
    adminId: number,
    decision: 'approved' | 'rejected'
  ) {
    try {
      const targetStatus = decision === 'approved' ? 'published' : 'rejected';
      const { rows } = await pool.query(
        `UPDATE posts 
         SET status = $1, admin_id = $2, published_at = NOW() 
         WHERE id = $3 
         RETURNING id, title, status`,
        [targetStatus, adminId || 1, postId]
      );

      try {
        await pool.query(
          `INSERT INTO audit_logs (actor_id, action, target_type, target_id)
           VALUES ($1, $2, 'post', $3)`,
          [adminId || 1, decision === 'approved' ? 'approve_post' : 'reject_post', postId]
        );
      } catch {}

      return rows[0] || null;
    } catch (err) {
      console.error('[AdminDbService] decidePostRequest error:', err);
      return null;
    }
  }

  // ---------------------------------------------------------------
  // Banned Keywords (Keyword Filter) — ใช้จริงใน /api/admin/keywords และ /api/feed/request
  // ---------------------------------------------------------------

  /** สร้างตาราง banned_keywords หากยังไม่มี (auto-migrate) */
  private async ensureBannedKeywordsTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS banned_keywords (
        id         SERIAL PRIMARY KEY,
        keyword    TEXT NOT NULL,
        added_by   INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        CONSTRAINT banned_keywords_keyword_uq UNIQUE (keyword)
      )
    `);
  }

  /** ดึงรายการคำต้องห้ามทั้งหมด */
  async getBannedKeywords() {
    await this.ensureBannedKeywordsTable();
    const { rows } = await pool.query(
      `SELECT bk.id, bk.keyword, bk.created_at, u.name AS added_by_name
       FROM banned_keywords bk
       LEFT JOIN users u ON u.id = bk.added_by
       ORDER BY bk.created_at DESC`
    );
    return rows;
  }

  /** เพิ่มคำต้องห้ามใหม่ */
  async addBannedKeyword(keyword: string, adminId: number) {
    await this.ensureBannedKeywordsTable();
    const { rows } = await pool.query(
      `INSERT INTO banned_keywords (keyword, added_by)
       VALUES ($1, $2)
       ON CONFLICT (keyword) DO NOTHING
       RETURNING *`,
      [keyword.trim().toLowerCase(), adminId]
    );
    return rows[0] ?? null;
  }

  /** ลบคำต้องห้าม */
  async removeBannedKeyword(id: number) {
    await this.ensureBannedKeywordsTable();
    const { rows } = await pool.query(`DELETE FROM banned_keywords WHERE id = $1 RETURNING *`, [id]);
    return rows[0] ?? null;
  }

  /**
   * ตรวจสอบข้อความว่ามีคำต้องห้ามหรือไม่
   * คืนค่า array ของคำที่พบ (ถ้าไม่พบจะเป็น [])
   */
  async checkForBannedKeywords(texts: string[]): Promise<string[]> {
    await this.ensureBannedKeywordsTable();
    const { rows } = await pool.query(`SELECT keyword FROM banned_keywords`);
    const keywords: string[] = rows.map((r: any) => r.keyword as string);
    const combined = texts.join(' ').toLowerCase();
    return keywords.filter((kw) => combined.includes(kw));
  }

  // ---------------------------------------------------------------
  // Wall Widgets (เซียมซี / วันเกิดประจำเดือน / อันดับกิจกรรม)
  // ใช้จริงใน /api/admin/wall-widgets (แอดมินจัดการ) และ /api/wall-widgets (หน้าวอลล์ดึงไปแสดง)
  // หมายเหตุ: วันเกิด ดึงจาก users.birth_date จริง, อันดับกิจกรรม ดึงจาก Top 3 Hall of Fame จริง
  // เหลือแค่ "เซียมซี" ที่ยังเป็นข้อความจัดการมือ เพราะไม่มีข้อมูลจริงในระบบให้ดึงมาแทน
  // ---------------------------------------------------------------

  /** สร้างตารางวิดเจ็ตหน้าวอลล์หากยังไม่มี (auto-migrate) */
  private async ensureWallWidgetsTables() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wall_fortunes (
        id         SERIAL PRIMARY KEY,
        message    TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);
  }

  /** ดึงข้อความเซียมซีทั้งหมด */
  async getWallFortunes() {
    await this.ensureWallWidgetsTables();
    const { rows } = await pool.query(
      `SELECT id, message, created_at FROM wall_fortunes ORDER BY created_at DESC`
    );
    return rows;
  }

  /** เพิ่มข้อความเซียมซีใหม่ */
  async addWallFortune(message: string) {
    await this.ensureWallWidgetsTables();
    const { rows } = await pool.query(
      `INSERT INTO wall_fortunes (message) VALUES ($1) RETURNING *`,
      [message.trim()]
    );
    return rows[0];
  }

  /** ลบข้อความเซียมซี */
  async removeWallFortune(id: number) {
    await this.ensureWallWidgetsTables();
    const { rows } = await pool.query(`DELETE FROM wall_fortunes WHERE id = $1 RETURNING *`, [id]);
    return rows[0] ?? null;
  }

  /**
   * ดึงรายชื่อสมาชิกที่วันนี้ตรงกับวันเกิดจริง (เดือน+วันของ birth_date ตรงกับวันนี้)
   * มาจากข้อมูลที่สมาชิกกรอกตอนสมัคร หรือแก้ไขย้อนหลังในหน้าทำเนียบรุ่น — ไม่ใช่ข้อมูลจำลอง
   */
  async getTodaysBirthdays() {
    const { rows } = await pool.query(`
      SELECT u.id, u.name, u.birth_date, gen.label as generation
      FROM users u
      LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
      WHERE u.status = 'approved'
        AND u.birth_date IS NOT NULL
        AND EXTRACT(MONTH FROM u.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(DAY FROM u.birth_date) = EXTRACT(DAY FROM CURRENT_DATE)
      ORDER BY u.name
    `);

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      generation: r.generation,
      birthLabel: new Date(r.birth_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
      avatar: r.name ? String(r.name).trim().slice(0, 2) : null,
    }));
  }

  /**
   * ดึงประวัติการดำเนินการของแอดมิน (audit trail) — ใช้จริงใน /api/admin/audit-logs
   * และแท็บ "ประวัติการดำเนินการ" ในแดชบอร์ด join ชื่อเป้าหมายจริงมาด้วยเท่าที่รู้จัก
   * target_type (user/post/campaign) ให้อ่านง่ายกว่าโชว์แค่ id ดิบๆ
   */
  async getAuditLogs(limit = 50) {
    const { rows } = await pool.query(
      `SELECT al.id, al.action, al.target_type, al.target_id,
              al.metadata, al.created_at,
              u.name AS actor_name,
              CASE WHEN al.target_type = 'user' THEN tu.name ELSE NULL END AS target_user_name,
              CASE WHEN al.target_type = 'post' THEN tp.title ELSE NULL END AS target_post_title,
              CASE WHEN al.target_type = 'campaign' THEN tc.title ELSE NULL END AS target_campaign_title
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.actor_id
       LEFT JOIN users tu ON al.target_type = 'user' AND tu.id = al.target_id
       LEFT JOIN posts tp ON al.target_type = 'post' AND tp.id = al.target_id
       LEFT JOIN hof_campaigns tc ON al.target_type = 'campaign' AND tc.id = al.target_id
       ORDER BY al.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return rows;
  }
}

export const adminDbService = new AdminDbService();
