import { pool } from '@/lib/db';
import { FIELD_LIMITS } from '@/lib/field-limits';

/**
 * รายงานเนื้อหา (Report) — สำหรับโพสต์/ความคิดเห็นที่หลุดตัวกรองคำ
 * ผู้ใช้กดรายงาน → เข้าคิว content_reports → แอดมินเลือก ซ่อน / ลบ / ยกเลิกรายงาน
 * การตัดสินใจทำทีละ "เนื้อหา" (รายงานที่ค้างทุกอันของเนื้อหาเดียวกันปิดพร้อมกัน)
 */

export type ReportTargetType = 'post' | 'comment';
export type ReportReason = 'inappropriate' | 'spam' | 'harassment' | 'misinformation' | 'other';
export type ReportAction = 'hide' | 'delete' | 'dismiss' | 'unhide';

export const REPORT_REASONS: Record<ReportReason, string> = {
  inappropriate: 'ถ้อยคำไม่เหมาะสม',
  spam: 'สแปม / โฆษณา',
  harassment: 'กลั่นแกล้ง / คุกคาม',
  misinformation: 'ข้อมูลเท็จ',
  other: 'อื่นๆ',
};

export interface ReportQueueItem {
  targetType: ReportTargetType;
  targetId: number;
  postId: number | null;
  preview: string;
  authorId: number | null;
  authorName: string | null;
  isHidden: boolean;
  reportCount: number;
  reasons: { reason: ReportReason; detail: string | null; reporterName: string; createdAt: string }[];
  firstReportedAt: string;
  status: string;
}

export class ReportDbService {
  async createReport(
    reporterId: number,
    targetType: ReportTargetType,
    targetId: number,
    reason: ReportReason,
    detail?: string
  ): Promise<{ created: boolean }> {
    if (!['post', 'comment'].includes(targetType)) throw new Error('ประเภทเนื้อหาไม่ถูกต้อง');
    if (!(reason in REPORT_REASONS)) throw new Error('กรุณาเลือกเหตุผลการรายงาน');
    const cleanDetail = detail?.trim() || null;
    if (cleanDetail && cleanDetail.length > FIELD_LIMITS.reportDetail) {
      throw new Error(`รายละเอียดต้องไม่เกิน ${FIELD_LIMITS.reportDetail} ตัวอักษร`);
    }

    const ownerSql =
      targetType === 'post'
        ? `SELECT COALESCE(requested_by, published_by) AS owner_id FROM posts WHERE id = $1`
        : `SELECT user_id AS owner_id FROM post_interactions WHERE id = $1 AND type = 'comment'`;
    const { rows } = await pool.query(ownerSql, [targetId]);
    if (rows.length === 0) throw new Error('ไม่พบเนื้อหาที่ต้องการรายงาน');
    if (rows[0].owner_id === reporterId) throw new Error('ไม่สามารถรายงานเนื้อหาของตัวเองได้');

    const result = await pool.query(
      `INSERT INTO content_reports (target_type, target_id, reported_by, reason, detail)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (target_type, target_id, reported_by) DO NOTHING`,
      [targetType, targetId, reporterId, reason, cleanDetail]
    );
    return { created: (result.rowCount ?? 0) > 0 };
  }

  /** คิวสำหรับแอดมิน: รวมรายงานตามเนื้อหา เรียงจากรายงานเก่าสุด */
  async getQueue(status: 'pending' | 'resolved' = 'pending'): Promise<ReportQueueItem[]> {
    const statusFilter = status === 'pending' ? `r.status = 'pending'` : `r.status <> 'pending'`;
    const { rows } = await pool.query(
      `SELECT
         r.target_type, r.target_id,
         MIN(r.created_at) AS first_reported_at,
         COUNT(*)::int AS report_count,
         MAX(r.status) AS status,
         json_agg(json_build_object(
           'reason', r.reason, 'detail', r.detail,
           'reporterName', ru.name, 'createdAt', r.created_at
         ) ORDER BY r.created_at) AS reasons,
         CASE WHEN r.target_type = 'post' THEN p.id ELSE c.post_id END AS post_id,
         CASE WHEN r.target_type = 'post' THEN p.title || ' — ' || COALESCE(p.content, '')
              ELSE c.content END AS preview,
         CASE WHEN r.target_type = 'post' THEN COALESCE(p.requested_by, p.published_by)
              ELSE c.user_id END AS author_id,
         CASE WHEN r.target_type = 'post' THEN p.is_hidden ELSE c.is_hidden END AS is_hidden
       FROM content_reports r
       JOIN users ru ON ru.id = r.reported_by
       LEFT JOIN posts p ON r.target_type = 'post' AND p.id = r.target_id
       LEFT JOIN post_interactions c ON r.target_type = 'comment' AND c.id = r.target_id
       WHERE ${statusFilter}
       GROUP BY r.target_type, r.target_id, p.id, c.id
       ORDER BY first_reported_at ASC
       LIMIT 200`
    );

    const authorIds = [...new Set(rows.map((r) => r.author_id).filter(Boolean))];
    const authorNames = new Map<number, string>();
    if (authorIds.length > 0) {
      const { rows: authors } = await pool.query(`SELECT id, name FROM users WHERE id = ANY($1::int[])`, [
        authorIds,
      ]);
      for (const a of authors) authorNames.set(a.id, a.name);
    }

    return rows.map((r) => ({
      targetType: r.target_type,
      targetId: r.target_id,
      postId: r.post_id,
      // เนื้อหาถูกลบไปแล้ว (ประวัติรายงานที่ปิดแล้ว) จะไม่มี preview
      preview: r.preview ?? '(เนื้อหาถูกลบแล้ว)',
      authorId: r.author_id,
      authorName: r.author_id ? authorNames.get(r.author_id) ?? null : null,
      isHidden: Boolean(r.is_hidden),
      reportCount: r.report_count,
      reasons: r.reasons,
      firstReportedAt: r.first_reported_at,
      status: r.status,
    }));
  }

  async countPending(): Promise<number> {
    const { rows } = await pool.query(
      `SELECT COUNT(DISTINCT (target_type, target_id))::int AS n FROM content_reports WHERE status = 'pending'`
    );
    return rows[0]?.n ?? 0;
  }

  /** แอดมินตัดสินใจกับเนื้อหาที่ถูกรายงาน */
  async resolve(targetType: ReportTargetType, targetId: number, action: ReportAction, adminId: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let reportStatus: 'hidden' | 'deleted' | 'dismissed' | null = null;
      if (action === 'hide' || action === 'unhide') {
        const table = targetType === 'post' ? 'posts' : 'post_interactions';
        const { rowCount } = await client.query(`UPDATE ${table} SET is_hidden = $1 WHERE id = $2`, [
          action === 'hide',
          targetId,
        ]);
        if (!rowCount) throw new Error('ไม่พบเนื้อหา อาจถูกลบไปแล้ว');
        reportStatus = action === 'hide' ? 'hidden' : null;
      } else if (action === 'delete') {
        if (targetType === 'post') {
          await client.query(`DELETE FROM post_interactions WHERE post_id = $1`, [targetId]);
          await client.query(
            `DELETE FROM poll_votes WHERE poll_id IN (SELECT id FROM polls WHERE post_id = $1)`,
            [targetId]
          );
          await client.query(
            `DELETE FROM poll_options WHERE poll_id IN (SELECT id FROM polls WHERE post_id = $1)`,
            [targetId]
          );
          await client.query(`DELETE FROM polls WHERE post_id = $1`, [targetId]);
          await client.query(`DELETE FROM media_assets WHERE owner_type = 'post' AND owner_id = $1`, [targetId]);
          await client.query(`DELETE FROM posts WHERE id = $1`, [targetId]);
        } else {
          await client.query(`DELETE FROM post_interactions WHERE id = $1 AND type = 'comment'`, [targetId]);
        }
        reportStatus = 'deleted';
      } else if (action === 'dismiss') {
        reportStatus = 'dismissed';
      } else {
        throw new Error('การดำเนินการไม่ถูกต้อง');
      }

      if (reportStatus) {
        await client.query(
          `UPDATE content_reports
           SET status = $1, resolved_by = $2, resolved_at = now()
           WHERE target_type = $3 AND target_id = $4 AND status = 'pending'`,
          [reportStatus, adminId, targetType, targetId]
        );
      }

      await client.query(
        `INSERT INTO audit_logs (actor_id, action, target_type, target_id, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [adminId, `report_${action}`, targetType, targetId, JSON.stringify({ source: 'content_reports' })]
      );

      await client.query('COMMIT');
      return { success: true, status: reportStatus };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export const reportDbService = new ReportDbService();
