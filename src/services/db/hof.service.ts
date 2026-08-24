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
   * กฎการคำนวณแต้ม:
   * - โหวตคนในรุ่นเดียวกัน = 5 คะแนน
   * - โหวตนอกรุ่น = 10 คะแนน
   */
  async voteCandidate(voterId: number, candidateId: number) {
    // ตรวจสอบว่าโหวตแล้วหรือยัง
    const { rows: existing } = await pool.query(
      `SELECT id FROM hof_votes WHERE voter_id = $1 AND candidate_id = $2`,
      [voterId, candidateId]
    );
    if (existing.length > 0) {
      throw new Error('คุณได้โหวตให้ผู้ได้รับการเสนอชื่อท่านนี้ไปแล้ว');
    }

    // ดึงรุ่นของผู้โหวตและผู้ถูกโหวต
    const { rows: voter } = await pool.query(
      `SELECT generation_option_id FROM users WHERE id = $1`,
      [voterId]
    );
    const { rows: candidate } = await pool.query(
      `SELECT u.generation_option_id 
       FROM hof_candidates hc 
       JOIN users u ON u.id = hc.user_id 
       WHERE hc.id = $1`,
      [candidateId]
    );

    const voterGen = voter[0]?.generation_option_id;
    const candidateGen = candidate[0]?.generation_option_id;

    // คำนวณแต้ม: ในรุ่นเดียวกัน = 5, นอกรุ่น = 10
    const voteCategory = voterGen && candidateGen && voterGen === candidateGen ? 'same_generation' : 'other_generation';
    const pointsAwarded = voteCategory === 'same_generation' ? 5 : 10;

    await pool.query(
      `INSERT INTO hof_votes (campaign_id, voter_id, candidate_id, vote_category, points)
       VALUES ((SELECT id FROM hof_campaigns LIMIT 1), $1, $2, $3, $4)`,
      [voterId, candidateId, voteCategory, pointsAwarded]
    );

    // ให้แต้มผู้โหวตด้วย (+pointsAwarded คะแนนสำหรับการมีส่วนร่วม)
    await pool.query(
      `UPDATE users SET total_points = total_points + $1 WHERE id = $2`,
      [pointsAwarded, voterId]
    );

    try {
      await pool.query(
        `INSERT INTO point_transactions (user_id, points, reason, reference_id)
         VALUES ($1, $2, 'hof_vote', $3)`,
        [voterId, pointsAwarded, String(candidateId)]
      );
    } catch {}

    return { success: true, pointsAwarded };
  }
}

export const hofDbService = new HofDbService();
