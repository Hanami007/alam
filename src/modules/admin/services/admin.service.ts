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
      const { rows: genCount } = await pool.query(
        `SELECT COUNT(*)::int as count FROM lookup_options WHERE category = 'generation'`
      );
      const { rows: candidateCount } = await pool.query(
        `SELECT COUNT(*)::int as count FROM hof_candidates`
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
  // ฟังก์ชันด้านล่างย้ายมาจาก src/lib/db.ts (god-file) — ปัจจุบันไม่มี route ใดเรียกใช้
  // คงไว้เพื่อรักษาพฤติกรรมเดิมทั้งหมด ไม่ได้ผูกกับ route ใดในตอนนี้
  // ---------------------------------------------------------------

  /** สถิติแดชบอร์ดรูปแบบเดิม (legacy, ยังไม่ได้ใช้งาน — ถูกแทนที่ด้วย getOverviewStats) */
  async getDashboardStatsLegacy() {
    const { rows: alumniCount } = await pool.query(
      `select count(*)::int as count from users where role = 'alumni' and status = 'approved'`
    );
    const { rows: genCount } = await pool.query(
      `select count(*)::int as count from lookup_options where category = 'generation'`
    );
    const { rows: candidateCount } = await pool.query(`select count(*)::int as count from hof_candidates`);
    const { rows: pendingCount } = await pool.query(`select count(*)::int as count from users where status = 'pending'`);

    return {
      totalAlumni: alumniCount[0].count,
      totalGenerations: genCount[0].count,
      outstandingAlumni: candidateCount[0].count,
      pendingApprovals: pendingCount[0].count,
    };
  }

  /** ดึง audit logs สำหรับ admin (legacy, ยังไม่ได้ใช้งาน — ไม่มีหน้า UI เรียกใช้ในปัจจุบัน) */
  async getAuditLogs(limit = 50) {
    const { rows } = await pool.query(
      `SELECT al.id, al.action, al.target_type, al.target_id,
              al.metadata, al.created_at,
              u.name AS actor_name
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.actor_id
       ORDER BY al.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return rows;
  }
}

export const adminDbService = new AdminDbService();
