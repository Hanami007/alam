import { pool } from '@/lib/db';
import { randomBytes } from 'crypto';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface HofResultRecord {
  id: number;
  campaignId: number;
  campaignTitle: string;
  quarter: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  finalizedAt: string;
  rank: number;
  userId: number;
  totalVotes: number;
  totalPoints: number;
  // Snapshot ณ วันประกาศ
  name: string;
  avatarUrl: string | null;
  company: string | null;
  position: string | null;
  generation: string | null;
  achievement: string | null;
}

export interface HofCampaignWithResults {
  id: number;
  title: string;
  status: 'open' | 'closed' | 'finalized';
  cycleNumber: number | null;
  quarter: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  autoCloseAt: string | null;
  finalizedAt: string | null;
  totalVotes: number;
  totalCandidates: number;
  top10: HofResultRecord[];
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class HofResultsService {
  /**
   * ดึง TOP 10 ของรอบล่าสุดที่ finalized แล้ว
   * สำหรับ Public API — ไม่ต้องล็อกอิน
   */
  async getLatestTop10(): Promise<HofResultRecord[]> {
    const { rows } = await pool.query(`
      SELECT
        hr.id,
        hr.campaign_id,
        hc.title          AS campaign_title,
        hc.quarter,
        hc.period_start::text,
        hc.period_end::text,
        hr.finalized_at::text,
        hr.rank,
        hr.user_id,
        hr.total_votes,
        hr.total_points,
        hr.snapshot_name        AS name,
        hr.snapshot_avatar      AS avatar_url,
        hr.snapshot_company     AS company,
        hr.snapshot_position    AS position,
        hr.snapshot_generation  AS generation,
        hr.snapshot_achievement AS achievement
      FROM hof_results hr
      JOIN hof_campaigns hc ON hc.id = hr.campaign_id
      WHERE hc.finalized_at IS NOT NULL
        AND hc.id = (
          SELECT id FROM hof_campaigns
          WHERE finalized_at IS NOT NULL
          ORDER BY finalized_at DESC
          LIMIT 1
        )
      ORDER BY hr.rank ASC
    `);

    return rows.map(this.mapRow);
  }

  /**
   * ดึง TOP 10 ของรอบที่ระบุ campaign_id
   */
  async getTop10ByCampaign(campaignId: number): Promise<HofResultRecord[]> {
    const { rows } = await pool.query(`
      SELECT
        hr.id,
        hr.campaign_id,
        hc.title          AS campaign_title,
        hc.quarter,
        hc.period_start::text,
        hc.period_end::text,
        hr.finalized_at::text,
        hr.rank,
        hr.user_id,
        hr.total_votes,
        hr.total_points,
        hr.snapshot_name        AS name,
        hr.snapshot_avatar      AS avatar_url,
        hr.snapshot_company     AS company,
        hr.snapshot_position    AS position,
        hr.snapshot_generation  AS generation,
        hr.snapshot_achievement AS achievement
      FROM hof_results hr
      JOIN hof_campaigns hc ON hc.id = hr.campaign_id
      WHERE hr.campaign_id = $1
      ORDER BY hr.rank ASC
    `, [campaignId]);

    return rows.map(this.mapRow);
  }

  /**
   * ดึงประวัติทุกรอบ + TOP 10 ของแต่ละรอบ (Admin & Public)
   */
  async getAllCycleHistory(): Promise<HofCampaignWithResults[]> {
    // ดึง campaigns ทั้งหมดที่มีผลแล้ว
    const { rows: campaigns } = await pool.query(`
      SELECT
        hc.id,
        hc.title,
        hc.status,
        hc.cycle_number,
        hc.quarter,
        hc.period_start::text,
        hc.period_end::text,
        hc.auto_close_at::text,
        hc.finalized_at::text,
        COUNT(DISTINCT hv.id)::int   AS total_votes,
        COUNT(DISTINCT hcand.id)::int AS total_candidates
      FROM hof_campaigns hc
      LEFT JOIN hof_candidates hcand ON hcand.campaign_id = hc.id
      LEFT JOIN hof_votes hv ON hv.campaign_id = hc.id
      GROUP BY hc.id, hc.title, hc.status, hc.cycle_number, hc.quarter,
               hc.period_start, hc.period_end, hc.auto_close_at, hc.finalized_at
      ORDER BY hc.id DESC
    `);

    if (campaigns.length === 0) return [];

    // ดึง results ทั้งหมดในคราวเดียว
    const campaignIds = campaigns.map((c: any) => c.id);
    const { rows: results } = await pool.query(`
      SELECT
        hr.*,
        hc.title AS campaign_title, hc.quarter,
        hc.period_start::text, hc.period_end::text,
        hr.finalized_at::text
      FROM hof_results hr
      JOIN hof_campaigns hc ON hc.id = hr.campaign_id
      WHERE hr.campaign_id = ANY($1::int[])
      ORDER BY hr.campaign_id DESC, hr.rank ASC
    `, [campaignIds]);

    // Group results by campaign_id
    const resultsByCampaign = new Map<number, HofResultRecord[]>();
    for (const r of results) {
      const list = resultsByCampaign.get(r.campaign_id) ?? [];
      list.push(this.mapRow(r));
      resultsByCampaign.set(r.campaign_id, list);
    }

    return campaigns.map((c: any) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      cycleNumber: c.cycle_number,
      quarter: c.quarter,
      periodStart: c.period_start,
      periodEnd: c.period_end,
      autoCloseAt: c.auto_close_at,
      finalizedAt: c.finalized_at,
      totalVotes: c.total_votes,
      totalCandidates: c.total_candidates,
      top10: resultsByCampaign.get(c.id) ?? [],
    }));
  }

  /**
   * Finalize campaign: ดึง TOP 10 จาก hof_votes แล้ว Snapshot เข้า hof_results
   * Admin เท่านั้น
   */
  async finalizeCampaign(campaignId: number, adminId: number): Promise<HofResultRecord[]> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // ตรวจสอบ campaign
      const { rows: campaignRows } = await client.query(
        `SELECT id, status, finalized_at FROM hof_campaigns WHERE id = $1`,
        [campaignId]
      );
      if (campaignRows.length === 0) throw new Error('ไม่พบ campaign');
      if (campaignRows[0].finalized_at) throw new Error('campaign นี้ประกาศผลไปแล้ว');

      // ดึง TOP 10 จาก hof_votes พร้อม snapshot ข้อมูล user
      const { rows: top10 } = await client.query(`
        SELECT
          hcand.id        AS candidate_id,
          u.id            AS user_id,
          u.name          AS snapshot_name,
          u.avatar_url    AS snapshot_avatar,
          u.company       AS snapshot_company,
          u.position      AS snapshot_position,
          gen.label       AS snapshot_generation,
          hcand.description AS snapshot_achievement,
          COUNT(hv.id)::int    AS total_votes,
          COALESCE(SUM(hv.points), 0)::int AS total_points
        FROM hof_candidates hcand
        JOIN users u ON u.id = hcand.user_id
        LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
        LEFT JOIN hof_votes hv ON hv.candidate_id = hcand.id AND hv.campaign_id = $1
        WHERE hcand.campaign_id = $1
        GROUP BY hcand.id, u.id, u.name, u.avatar_url, u.company, u.position, gen.label, hcand.description
        ORDER BY total_votes DESC, total_points DESC
        LIMIT 10
      `, [campaignId]);

      if (top10.length === 0) throw new Error('ไม่มีผู้ได้รับการเสนอชื่อในรอบนี้');

      // ลบ results เก่าถ้ามี (กรณี re-finalize)
      await client.query(`DELETE FROM hof_results WHERE campaign_id = $1`, [campaignId]);

      // Insert TOP 10 snapshot
      for (let i = 0; i < top10.length; i++) {
        const r = top10[i];
        await client.query(`
          INSERT INTO hof_results
            (campaign_id, candidate_id, user_id, rank, total_votes, total_points,
             snapshot_name, snapshot_avatar, snapshot_company, snapshot_position,
             snapshot_generation, snapshot_achievement)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          campaignId, r.candidate_id, r.user_id, i + 1,
          r.total_votes, r.total_points,
          r.snapshot_name, r.snapshot_avatar, r.snapshot_company, r.snapshot_position,
          r.snapshot_generation, r.snapshot_achievement,
        ]);
      }

      // อัปเดต campaign status → closed + finalized_at
      await client.query(`
        UPDATE hof_campaigns
        SET status = 'closed', finalized_at = now()
        WHERE id = $1
      `, [campaignId]);

      // audit log
      try {
        await client.query(`
          INSERT INTO audit_logs (actor_id, action, target_type, target_id, metadata)
          VALUES ($1, 'hof_finalize', 'campaign', $2, $3)
        `, [adminId, campaignId, JSON.stringify({ top10Count: top10.length })]);
      } catch { /* audit fail ไม่ rollback */ }

      await client.query('COMMIT');

      return this.getTop10ByCampaign(campaignId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * สร้าง campaign รอบใหม่ (Admin เท่านั้น)
   */
  async createNewCycle(adminId: number, opts: {
    title: string;
    periodStart: string;  // ISO date
    periodEnd: string;    // ISO date
    quarter?: string;
  }): Promise<{ id: number; title: string; status: string }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // นับรอบถัดไป
      const { rows: countRows } = await client.query(
        `SELECT COALESCE(MAX(cycle_number), 0) + 1 AS next_cycle FROM hof_campaigns`
      );
      const nextCycle = countRows[0].next_cycle;

      // ปิด campaign เก่าที่ยังค้าง open
      await client.query(`UPDATE hof_campaigns SET status = 'closed' WHERE status = 'open'`);

      const { rows } = await client.query(`
        INSERT INTO hof_campaigns (title, status, cycle_number, quarter, period_start, period_end, auto_close_at)
        VALUES ($1, 'open', $2, $3, $4, $5, $5::date + interval '1 day')
        RETURNING id, title, status, cycle_number, quarter
      `, [opts.title, nextCycle, opts.quarter ?? null, opts.periodStart, opts.periodEnd]);

      await client.query(`
        INSERT INTO audit_logs (actor_id, action, target_type, target_id, metadata)
        VALUES ($1, 'hof_create_cycle', 'campaign', $2, $3)
      `, [adminId, rows[0].id, JSON.stringify({ cycleNumber: nextCycle })]);

      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * แก้ไข/ลบ result ใน TOP 10 (Admin)
   */
  async updateResult(resultId: number, data: {
    rank?: number;
    snapshotAchievement?: string;
  }): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.rank !== undefined) {
      updates.push(`rank = $${idx++}`);
      values.push(data.rank);
    }
    if (data.snapshotAchievement !== undefined) {
      updates.push(`snapshot_achievement = $${idx++}`);
      values.push(data.snapshotAchievement);
    }

    if (updates.length === 0) return;
    values.push(resultId);

    await pool.query(
      `UPDATE hof_results SET ${updates.join(', ')} WHERE id = $${idx}`,
      values
    );
  }

  async deleteResult(resultId: number): Promise<void> {
    await pool.query(`DELETE FROM hof_results WHERE id = $1`, [resultId]);
  }

  /** ดึงค่า public_api_key ปัจจุบันจาก system_settings สำหรับให้แอดมินคัดลอกไปตั้งค่าเว็บภายนอก */
  async getPublicApiKey(): Promise<string | null> {
    const { rows } = await pool.query(
      `SELECT value FROM system_settings WHERE key = 'public_api_key' LIMIT 1`
    );
    return rows[0]?.value ?? null;
  }

  /**
   * สร้าง public_api_key ใหม่แบบสุ่มปลอดภัย (แทนค่า placeholder 'CHANGE_ME_BEFORE_PRODUCTION'
   * ที่เคย commit ไว้ในโค้ดจริงๆ — ใครอ่าน repo ก็รู้ค่าได้ ถือว่าไม่มีการป้องกันจริง) ให้แอดมิน
   * กดหมุนคีย์เองได้จากหน้าแดชบอร์ดโดยตรง ไม่ต้องพึ่งโปรแกรมเมอร์มาแก้ DB ให้ทุกครั้ง
   */
  async regeneratePublicApiKey(): Promise<string> {
    const newKey = randomBytes(24).toString('hex');
    await pool.query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ('public_api_key', $1, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [newKey]
    );
    return newKey;
  }

  /**
   * ตรวจสอบ Public API Key จาก system_settings
   */
  async verifyPublicApiKey(key: string): Promise<boolean> {
    if (!key) return false;
    // ถ้ากำหนด PUBLIC_HOF_API_KEY ใน env ให้ใช้ env ก่อน (ง่ายกว่าไม่ต้องแตะ DB)
    if (process.env.PUBLIC_HOF_API_KEY) {
      return key === process.env.PUBLIC_HOF_API_KEY;
    }
    // Fallback: ดูจาก system_settings
    try {
      const { rows } = await pool.query(
        `SELECT value FROM system_settings WHERE key = 'public_api_key' LIMIT 1`
      );
      return rows[0]?.value === key;
    } catch {
      return false;
    }
  }

  private mapRow(r: any): HofResultRecord {
    return {
      id: r.id,
      campaignId: r.campaign_id,
      campaignTitle: r.campaign_title,
      quarter: r.quarter,
      periodStart: r.period_start,
      periodEnd: r.period_end,
      finalizedAt: r.finalized_at,
      rank: r.rank,
      userId: r.user_id,
      totalVotes: r.total_votes,
      totalPoints: r.total_points,
      name: r.snapshot_name ?? r.name,
      avatarUrl: r.snapshot_avatar ?? r.avatar_url,
      company: r.snapshot_company ?? r.company,
      position: r.snapshot_position ?? r.position,
      generation: r.snapshot_generation ?? r.generation,
      achievement: r.snapshot_achievement ?? r.achievement,
    };
  }
}

export const hofResultsService = new HofResultsService();
