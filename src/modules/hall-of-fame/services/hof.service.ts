import { pool } from '@/lib/db';

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
   * ดึงรายชื่อผู้ได้รับการเสนอชื่อ Hall of Fame พร้อมคะแนนโหวตสะสม
   */
  async getCandidates(): Promise<HofCandidateRecord[]> {
    try {
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
        LEFT JOIN hof_votes hv ON hv.candidate_id = hc.id
        GROUP BY hc.id, hc.user_id, hc.description, u.student_id, u.name, u.avatar_url, u.position, u.company, u.generation_option_id, gen.label, ct.label
        ORDER BY hof_points DESC, vote_count DESC
      `);

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
   * ค้นหาผู้ได้รับการเสนอชื่อ Hall of Fame
   */
  async searchCandidates(query: string): Promise<HofCandidateRecord[]> {
    try {
      const searchTerm = `%${query}%`;
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
        LEFT JOIN hof_votes hv ON hv.candidate_id = hc.id
        WHERE u.name ILIKE $1
           OR u.company ILIKE $1
           OR u.position ILIKE $1
           OR hc.description ILIKE $1
           OR gen.label ILIKE $1
        GROUP BY hc.id, hc.user_id, hc.description, u.student_id, u.name, u.avatar_url, u.position, u.company, u.generation_option_id, gen.label, ct.label
        ORDER BY hof_points DESC
        LIMIT 50
      `, [searchTerm]);

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
      console.error('[HofDbService] searchCandidates error:', err);
      return [];
    }
  }

  /**
   * บันทึกการโหวต Hall of Fame
   * กติกา: โหวตได้ในรุ่นตัวเอง 1 ครั้ง และนอกรุ่นตัวเอง 1 ครั้ง (รวมสูงสุด 2 โหวตต่อแคมเปญ)
   * ผู้ถูกโหวตได้ 1 คะแนนเสมอต่อโหวต (ไม่แบ่ง 5/10 ตามรุ่นแล้ว — รุ่นมีผลแค่กับโควตาสิทธิ์โหวต)
   */
  async voteCandidate(voterId: number, candidateId: number) {
    const { rows: existing } = await pool.query(
      `SELECT id FROM hof_votes WHERE voter_id = $1 AND candidate_id = $2`,
      [voterId, candidateId]
    );
    if (existing.length > 0) {
      throw new Error('คุณได้โหวตให้ผู้ได้รับการเสนอชื่อท่านนี้ไปแล้ว');
    }

    const { rows: campaignRows } = await pool.query(`SELECT id FROM hof_campaigns LIMIT 1`);
    const campaignId = campaignRows[0]?.id;

    const { rows: voter } = await pool.query(`SELECT generation_option_id FROM users WHERE id = $1`, [voterId]);
    const { rows: candidate } = await pool.query(
      `SELECT u.generation_option_id
       FROM hof_candidates hc
       JOIN users u ON u.id = hc.user_id
       WHERE hc.id = $1`,
      [candidateId]
    );
    const voterGen = voter[0]?.generation_option_id;
    const candidateGen = candidate[0]?.generation_option_id;
    const voteCategory = voterGen && candidateGen && voterGen === candidateGen ? 'same_generation' : 'other_generation';

    const { rows: existingInCategory } = await pool.query(
      `SELECT id FROM hof_votes WHERE campaign_id = $1 AND voter_id = $2 AND vote_category = $3`,
      [campaignId, voterId, voteCategory]
    );
    if (existingInCategory.length > 0) {
      throw new Error(
        voteCategory === 'same_generation' ? 'คุณใช้สิทธิ์โหวตในรุ่นตัวเองไปแล้ว' : 'คุณใช้สิทธิ์โหวตนอกรุ่นตัวเองไปแล้ว'
      );
    }

    const candidatePoints = 1; // ผู้ถูกโหวตได้เพิ่ม 1 คะแนนต่อโหวตเสมอ
    const voterReward = 10; // แต้มสะสมของผู้โหวตเอง (คนละระบบกับคะแนน Hall of Fame ของผู้ถูกโหวต)

    await pool.query(
      `INSERT INTO hof_votes (campaign_id, voter_id, candidate_id, vote_category, points)
       VALUES ($1, $2, $3, $4, $5)`,
      [campaignId, voterId, candidateId, voteCategory, candidatePoints]
    );

    await pool.query(`UPDATE users SET total_points = total_points + $1 WHERE id = $2`, [voterReward, voterId]);

    try {
      await pool.query(
        `INSERT INTO point_transactions (user_id, points, reason, reference_id)
         VALUES ($1, $2, 'hof_vote', $3)`,
        [voterId, voterReward, String(candidateId)]
      );
    } catch {}

    return { success: true, pointsAwarded: voterReward };
  }

  // ---------------------------------------------------------------
  // ฟังก์ชันด้านล่างย้ายมาจาก src/lib/db.ts (god-file) — ใช้งานจริงใน hof/search/route.ts
  // คงชื่อ/รูปแบบข้อมูลเดิม (snake_case) ไว้แยกจาก getCandidates/searchCandidates ด้านบน
  // เพื่อไม่ให้พฤติกรรมของ /api/hof/search เปลี่ยนแปลง
  // ---------------------------------------------------------------

  /** รายชื่อศิษย์เก่า Hall of Fame รูปแบบเดิม (ใช้เมื่อไม่มีคำค้นหาใน /api/hof/search) */
  async getCandidatesLegacyFormat() {
    const { rows } = await pool.query(`
      select
        u.id,
        u.name,
        u.avatar_url as image,
        u.position as occupation,
        u.company,
        ct.label as employment_type,
        gen.label as generation,
        hc.description as achievement,
        coalesce(sum(hv.points), 0)::int as hof_points
      from hof_candidates hc
      join users u on u.id = hc.user_id
      left join lookup_options gen on gen.id = u.generation_option_id
      left join lookup_options ct on ct.id = u.career_option_id
      left join hof_votes hv on hv.candidate_id = hc.id
      group by u.id, u.name, u.avatar_url, u.position, u.company, ct.label, gen.label, hc.description
      order by hof_points desc
    `);
    return rows;
  }

  /** ค้นหา Hall of Fame แบบ single search box (รูปแบบข้อมูลเดิม) */
  async searchCandidatesLegacyFormat(query: string) {
    const searchTerm = `%${query}%`;
    const { rows } = await pool.query(`
      select
        hc.id, hc.description,
        u.name, u.company, u.position, u.avatar_url,
        gen.label as generation_label
      from hof_candidates hc
      join users u on u.id = hc.user_id
      left join lookup_options gen on gen.id = u.generation_option_id
      where u.name ilike $1
         or u.company ilike $1
         or u.position ilike $1
         or hc.description ilike $1
         or gen.label ilike $1
      order by hc.id desc
      limit 50
    `, [searchTerm]);
    return rows;
  }
}

export const hofDbService = new HofDbService();
