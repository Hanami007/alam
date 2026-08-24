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
   * ดึงคิวคำขอโพสต์ที่รออนุมัติ พร้อมรายละเอียดโพล (ถ้ามี)
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
        WHERE p.status IN ('pending', 'pending_request')
        ORDER BY p.created_at DESC
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
}

export const adminDbService = new AdminDbService();
