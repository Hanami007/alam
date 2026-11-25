import { pool } from '@/lib/db';

/** ข้อผิดพลาดที่ตั้งใจให้ผู้โหวตเห็น พร้อม HTTP status */
export class HofVoteError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export interface HofCandidateRecord {
  id: number;
  userId: number;
  studentId?: string;
  name: string;
  avatarUrl?: string;
  position?: string;
  company?: string;
  employmentType?: string;
  generation?: string;
  generationOptionId?: number;
  achievement: string;
  hofPoints: number;
  voteCount: number;
}

export class HofDbService {
  /**
   * ดึงสถานะแคมเปญ Hall of Fame "ปัจจุบัน" = แคมเปญล่าสุดที่สร้างไว้ (id มากสุด)
   * คืนค่า null ถ้ายังไม่มีแคมเปญเลยในระบบ
   *
   * เดิมใช้ ORDER BY id ASC (แคมเปญแรกสุด/เก่าสุด) ซึ่งขัดกับระบบ "สร้างรอบใหม่" (createNewCycle
   * ใน hof-results.service.ts) ที่สร้างแถวใหม่ทุกครั้งที่เปิดรอบใหม่ — พอมีมากกว่า 1 แคมเปญ ปุ่ม
   * เปิด/ปิดโหวตแบบง่ายนี้จะไปแก้แคมเปญเก่าสุดเสมอ ในขณะที่ระบบรอบใหม่มองว่าแคมเปญล่าสุดคือ
   * "ตัวปัจจุบัน" ทำให้เปิดพร้อมกันได้ 2 แคมเปญ และหน้าโหวตจะสุ่มว่าใช้อันไหน (ไม่ deterministic)
   * เปลี่ยนเป็น DESC ให้ทั้งสองระบบอ้างอิง "แคมเปญปัจจุบัน" เป็นแถวเดียวกันเสมอ
   */
  async getCampaignStatus(): Promise<{ id: number; status: 'open' | 'closed'; title: string } | null> {
    try {
      const { rows } = await pool.query(
        `SELECT id, status, title FROM hof_campaigns ORDER BY id DESC LIMIT 1`
      );
      return rows[0] ?? null;
    } catch (err) {
      console.error('[HofDbService] getCampaignStatus error:', err);
      return null;
    }
  }

  /**
   * เปิด/ปิดการโหวต Hall of Fame — ใช้กับแคมเปญ "ปัจจุบัน" (ล่าสุด) เท่านั้น ไม่สร้างใหม่
   * (ดูคำอธิบายเรื่อง ASC→DESC ที่ getCampaignStatus ด้านบน — ต้องอ้างอิงแคมเปญเดียวกันเสมอ)
   */
  async setCampaignStatus(status: 'open' | 'closed'): Promise<{ id: number; status: string; title: string }> {
    const { rows } = await pool.query(
      `UPDATE hof_campaigns SET status = $1
       WHERE id = (SELECT id FROM hof_campaigns ORDER BY id DESC LIMIT 1)
       RETURNING id, status, title`,
      [status]
    );
    if (rows.length === 0) {
      throw new Error('ไม่พบแคมเปญ Hall of Fame ในระบบ');
    }
    return rows[0];
  }

  /**
   * เมื่อแคมเปญเปิดโหวตอยู่ ให้ศิษย์เก่าที่ได้รับอนุมัติทุกคนเป็นผู้ถูกเสนอชื่อได้ทันที
   * เติมแถว hof_candidates ให้ครบ เฉพาะคนที่ยังไม่มีในแคมเปญนี้ ไม่แตะแถวเดิม (คำอธิบายผลงานเดิมไม่หาย)
   *
   * ผู้ถูกเสนอชื่อต้องเป็นศิษย์เก่า (student_status = 'alumni') — role = 'alumni' แค่แปลว่า
   * "สมาชิกที่ไม่ใช่แอดมิน" ซึ่งรวมศิษย์ปัจจุบันด้วย ส่วนคนโหวตยังเป็นใครก็ได้ในระบบเหมือนเดิม
   * ศิษย์ปัจจุบันที่เคยถูกเติมเข้ามาก่อนหน้าจะถูกซ่อนใน query (ไม่ลบแถว) และจะกลับมาเองเมื่อจบการศึกษา
   */
  private async ensureAllAlumniAreCandidates(campaignId: number): Promise<void> {
    await pool.query(
      `INSERT INTO hof_candidates (campaign_id, user_id, description)
       SELECT $1, u.id, ''
       FROM users u
       WHERE u.status = 'approved' AND u.role = 'alumni' AND u.student_status = 'alumni'
         AND NOT EXISTS (
           SELECT 1 FROM hof_candidates hc WHERE hc.campaign_id = $1 AND hc.user_id = u.id
         )`,
      [campaignId]
    );
  }

  /**
   * ดึงรายชื่อผู้ได้รับการเสนอชื่อ Hall of Fame พร้อมคะแนนโหวตสะสม — เฉพาะแคมเปญปัจจุบันเท่านั้น
   *
   * เดิม query นี้ไม่กรอง campaign_id เลย รวมคะแนนโหวตจาก hof_votes ทุกแคมเปญตั้งแต่วันแรก
   * เข้าด้วยกันตลอดกาล ทำให้ "เปิดรอบใหม่" (createNewCycle) ไม่รีเซ็ตอันดับเลยตามที่ออกแบบไว้
   * ต้องกรองด้วย hc.campaign_id เพื่อให้แต่ละรอบนับคะแนนแยกจากกันจริง
   */
  async getCandidates(): Promise<HofCandidateRecord[]> {
    try {
      const campaign = await this.getCampaignStatus();
      if (!campaign) return [];
      if (campaign.status === 'open') {
        await this.ensureAllAlumniAreCandidates(campaign.id);
      }

      const { rows } = await pool.query(`
        SELECT
          hc.id,
          hc.user_id,
          hc.description as achievement,
          u.student_id,
          u.name,
          u.avatar_url,
          u.position,
          u.company,
          u.generation_option_id,
          gen.label as generation,
          ct.label as employment_type,
          COALESCE(SUM(hv.points), 0)::int as hof_points,
          COALESCE(COUNT(hv.id), 0)::int as vote_count
        FROM hof_candidates hc
        JOIN users u ON u.id = hc.user_id
        LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
        LEFT JOIN lookup_options ct ON ct.id = u.career_option_id
        LEFT JOIN hof_votes hv ON hv.candidate_id = hc.id AND hv.campaign_id = hc.campaign_id
        WHERE hc.campaign_id = $1 AND u.student_status = 'alumni'
        GROUP BY hc.id, hc.user_id, hc.description, u.student_id, u.name, u.avatar_url, u.position, u.company, u.generation_option_id, gen.label, ct.label
        ORDER BY hof_points DESC, vote_count DESC
      `, [campaign.id]);

      return rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        studentId: r.student_id,
        name: r.name,
        avatarUrl: r.avatar_url,
        position: r.position,
        company: r.company,
        employmentType: r.employment_type,
        generation: r.generation,
        generationOptionId: r.generation_option_id,
        achievement: r.achievement,
        hofPoints: r.hof_points,
        voteCount: r.vote_count,
      }));
    } catch (err) {
      console.error('[HofDbService] getCandidates error:', err);
      return [];
    }
  }

  /**
   * บันทึกการโหวต Hall of Fame — โค้ดโหวตมีที่เดียวคือที่นี่ (/api/hof/vote เรียกใช้)
   * กติกา: โหวตได้ในรุ่นตัวเอง 1 ครั้ง และนอกรุ่นตัวเอง 1 ครั้ง (รวมสูงสุด 2 โหวตต่อแคมเปญ)
   * ผู้ถูกโหวตได้ 1 คะแนนเสมอต่อโหวต ผู้โหวตได้แต้มสะสม 10
   *
   * แคมเปญ = getCampaignStatus() ตัวเดียวกับที่หน้าเว็บแสดง — เดิม route ใช้ "open ตัวไหนก็ได้"
   * (ไม่มี ORDER BY) จึงได้แคมเปญทดสอบ id 1 แทนแคมเปญปัจจุบัน โหวตไปลงผิดแคมเปญ
   */
  async voteCandidate(voterId: number, candidateId: number) {
    const campaign = await this.getCampaignStatus();
    if (!campaign || campaign.status !== 'open') {
      throw new HofVoteError('ขณะนี้ยังไม่เปิดโหวต Hall of Fame', 403);
    }

    const { rows: candidate } = await pool.query(
      `SELECT hc.user_id, u.generation_option_id, u.student_status
       FROM hof_candidates hc
       JOIN users u ON u.id = hc.user_id
       WHERE hc.id = $1 AND hc.campaign_id = $2`,
      [candidateId, campaign.id]
    );
    if (candidate.length === 0) {
      throw new HofVoteError('ไม่พบผู้ได้รับการเสนอชื่อนี้ในรอบโหวตปัจจุบัน', 404);
    }
    if (candidate[0].user_id === voterId) {
      throw new HofVoteError('โหวตให้ตัวเองไม่ได้', 400);
    }
    if (candidate[0].student_status !== 'alumni') {
      throw new HofVoteError('โหวตได้เฉพาะศิษย์เก่าเท่านั้น', 400);
    }

    const { rows: existing } = await pool.query(
      `SELECT id FROM hof_votes WHERE campaign_id = $1 AND voter_id = $2 AND candidate_id = $3`,
      [campaign.id, voterId, candidateId]
    );
    if (existing.length > 0) {
      throw new HofVoteError('คุณโหวตให้ผู้ได้รับการเสนอชื่อท่านนี้ไปแล้ว', 409);
    }

    const { rows: voter } = await pool.query(`SELECT generation_option_id FROM users WHERE id = $1`, [voterId]);
    const voterGen = voter[0]?.generation_option_id;
    const candidateGen = candidate[0].generation_option_id;
    const voteCategory = voterGen && candidateGen && voterGen === candidateGen ? 'same_generation' : 'other_generation';
    const usedUpMessage =
      voteCategory === 'same_generation' ? 'คุณใช้สิทธิ์โหวตในรุ่นตัวเองไปแล้ว' : 'คุณใช้สิทธิ์โหวตนอกรุ่นตัวเองไปแล้ว';

    const { rows: existingInCategory } = await pool.query(
      `SELECT id FROM hof_votes WHERE campaign_id = $1 AND voter_id = $2 AND vote_category = $3`,
      [campaign.id, voterId, voteCategory]
    );
    if (existingInCategory.length > 0) throw new HofVoteError(usedUpMessage, 409);

    const voterReward = 10;
    // โหวต + แต้มรวม + ประวัติแต้ม อยู่ใน transaction เดียว — เดิมบันทึกประวัติแต้มแยกนอก transaction
    // ถ้าพัง total_points กับ point_transactions จะไม่ตรงกัน
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO hof_votes (campaign_id, voter_id, candidate_id, vote_category, points)
         VALUES ($1, $2, $3, $4, 1)`,
        [campaign.id, voterId, candidateId, voteCategory]
      );
      await client.query(`UPDATE users SET total_points = total_points + $1 WHERE id = $2`, [voterReward, voterId]);
      await client.query(
        `INSERT INTO point_transactions (user_id, points, reason, reference_id) VALUES ($1, $2, 'hof_vote', $3)`,
        [voterId, voterReward, String(candidateId)]
      );
      await client.query('COMMIT');
    } catch (err: any) {
      await client.query('ROLLBACK');
      // กดโหวตซ้อนกัน 2 ครั้งพร้อมกัน → ชน UNIQUE (campaign_id, voter_id, vote_category)
      if (err?.code === '23505') throw new HofVoteError(usedUpMessage, 409);
      throw err;
    } finally {
      client.release();
    }

    return { pointsAwarded: voterReward, voteCategory };
  }
}

export const hofDbService = new HofDbService();
