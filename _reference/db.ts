/**
 * _reference/db.ts
 *
 * เวอร์ชัน draft ที่เขียนไว้ก่อนหน้า — ใช้เป็น reference เพื่อ merge
 * กับ src/lib/db.ts จริง
 *
 * ฟังก์ชันในไฟล์นี้ที่ยังไม่มีใน db.ts จริงจะถูก merge เข้าไป
 */

import { Pool } from 'pg';

// ── สมมติว่าใช้ pool จากที่อื่น ─────────────────────────────────────
declare const pool: Pool;

// ---------------------------------------------------------------
// Lookup / Dropdown data
// ---------------------------------------------------------------

/** ดึง generations ทั้งหมดสำหรับ dropdown filter */
export async function getGenerations() {
  const { rows } = await pool.query(
    `SELECT id, code, label, extra FROM lookup_options WHERE category = 'generation' ORDER BY code`
  );
  return rows;
}

/** ดึงจังหวัดทั้งหมด พร้อม region */
export async function getAllProvinces() {
  const { rows } = await pool.query(
    `SELECT id, code, label, extra->>'region' AS region, (extra->>'metro')::boolean AS metro
     FROM lookup_options WHERE category = 'province' ORDER BY label`
  );
  return rows;
}

/** ดึง career types สำหรับ dropdown */
export async function getCareerTypes() {
  const { rows } = await pool.query(
    `SELECT id, code, label FROM lookup_options WHERE category = 'career_type' ORDER BY label`
  );
  return rows;
}

// ---------------------------------------------------------------
// User Management (Admin)
// ---------------------------------------------------------------

/** อนุมัติ user */
export async function approveUser(userId: number, adminId: number) {
  const { rows } = await pool.query(
    `UPDATE users SET status = 'approved' WHERE id = $1 AND status = 'pending' RETURNING id, name, status`,
    [userId]
  );
  // log audit
  await pool.query(
    `INSERT INTO audit_logs (actor_id, action, target_type, target_id) VALUES ($1, 'approve_user', 'user', $2)`,
    [adminId, userId]
  );
  return rows[0] ?? null;
}

/** ปฏิเสธ user */
export async function rejectUser(userId: number, adminId: number, remark?: string) {
  const { rows } = await pool.query(
    `UPDATE users SET status = 'rejected' WHERE id = $1 AND status = 'pending' RETURNING id, name, status`,
    [userId]
  );
  await pool.query(
    `INSERT INTO audit_logs (actor_id, action, target_type, target_id, metadata) VALUES ($1, 'reject_user', 'user', $2, $3)`,
    [adminId, userId, JSON.stringify({ remark: remark ?? '' })]
  );
  return rows[0] ?? null;
}

/** ดึง user ตาม id (ใช้ใน middleware / auth) */
export async function getUserById(userId: number) {
  const { rows } = await pool.query(
    `SELECT u.*, gen.label AS generation, prov.label AS province, ct.label AS career_type
     FROM users u
     LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
     LEFT JOIN lookup_options prov ON prov.id = u.province_option_id
     LEFT JOIN lookup_options ct ON ct.id = u.career_option_id
     WHERE u.id = $1`,
    [userId]
  );
  return rows[0] ?? null;
}

/** อัปเดต profile ของ user */
export async function updateUserProfile(
  userId: number,
  data: {
    name?: string;
    company?: string;
    position?: string;
    bio?: string;
    avatar_url?: string;
    career_option_id?: number;
    province_option_id?: number;
    hometown_province_id?: number;
    work_province_id?: number;
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

// ---------------------------------------------------------------
// Search
// ---------------------------------------------------------------

/** ค้นหาศิษย์เก่าแบบ full-text (ชื่อ, บริษัท, ตำแหน่ง, จังหวัด, รุ่น) */
export async function searchAlumni(
  query: string,
  opts?: { generationId?: number; provinceId?: number; careerId?: number; limit?: number }
) {
  const searchTerm = `%${query}%`;
  const params: unknown[] = [searchTerm];
  const filters: string[] = [
    `(u.name ILIKE $1 OR u.company ILIKE $1 OR u.position ILIKE $1 OR gen.label ILIKE $1 OR prov.label ILIKE $1)`
  ];

  let i = 2;
  if (opts?.generationId) { filters.push(`u.generation_option_id = $${i++}`); params.push(opts.generationId); }
  if (opts?.provinceId)   { filters.push(`u.province_option_id = $${i++}`);   params.push(opts.provinceId); }
  if (opts?.careerId)     { filters.push(`u.career_option_id = $${i++}`);      params.push(opts.careerId); }

  const limit = opts?.limit ?? 50;
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.position, u.company, u.avatar_url, u.total_points,
            gen.label AS generation, prov.label AS province, ct.label AS career_type
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

// ---------------------------------------------------------------
// Voting (Poll)
// ---------------------------------------------------------------

/** โหวต poll — คืน error string ถ้าโหวตแล้ว */
export async function castPollVote(
  pollId: number,
  optionId: number,
  userId: number
): Promise<{ success: boolean; error?: string; pointsAwarded?: number }> {
  // เช็คว่าโหวตแล้วหรือยัง
  const { rows: existing } = await pool.query(
    `SELECT id FROM poll_votes WHERE poll_id = $1 AND user_id = $2`,
    [pollId, userId]
  );
  if (existing.length > 0) return { success: false, error: 'โหวตแล้ว' };

  const { rows: pollRows } = await pool.query(
    `SELECT points_per_vote FROM polls WHERE id = $1 AND status = 'active'`,
    [pollId]
  );
  if (pollRows.length === 0) return { success: false, error: 'ไม่พบโพลหรือโพลปิดแล้ว' };

  const points = pollRows[0].points_per_vote as number;

  await pool.query(
    `INSERT INTO poll_votes (poll_id, option_id, user_id, points_awarded) VALUES ($1, $2, $3, $4)`,
    [pollId, optionId, userId, points]
  );
  if (points > 0) {
    await pool.query(
      `UPDATE users SET total_points = total_points + $1 WHERE id = $2`,
      [points, userId]
    );
  }
  return { success: true, pointsAwarded: points };
}

// ---------------------------------------------------------------
// Hall of Fame Voting
// ---------------------------------------------------------------

/** โหวต Hall of Fame */
export async function castHofVote(
  campaignId: number,
  voterId: number,
  candidateId: number,
  voteCategory: 'same_generation' | 'other_generation'
): Promise<{ success: boolean; error?: string; points?: number }> {
  // เช็คว่าโหวต category นี้ในแคมเปญนี้แล้วหรือยัง
  const { rows: existing } = await pool.query(
    `SELECT id FROM hof_votes WHERE campaign_id = $1 AND voter_id = $2 AND vote_category = $3`,
    [campaignId, voterId, voteCategory]
  );
  if (existing.length > 0) return { success: false, error: `โหวต ${voteCategory} ในแคมเปญนี้แล้ว` };

  const points = voteCategory === 'same_generation' ? 5 : 10;

  await pool.query(
    `INSERT INTO hof_votes (campaign_id, voter_id, candidate_id, vote_category, points)
     VALUES ($1, $2, $3, $4, $5)`,
    [campaignId, voterId, candidateId, voteCategory, points]
  );
  await pool.query(
    `UPDATE users SET total_points = total_points + $1 WHERE id = $2`,
    [points, voterId]
  );
  return { success: true, points };
}

/** ดึง leaderboard คะแนนรวม */
export async function getLeaderboard(limit = 20) {
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.avatar_url, u.total_points,
            gen.label AS generation, u.position, u.company
     FROM users u
     LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
     WHERE u.status = 'approved' AND u.role = 'alumni'
     ORDER BY u.total_points DESC, u.name
     LIMIT $1`,
    [limit]
  );
  return rows;
}

// ---------------------------------------------------------------
// Gallery / Photo unlock
// ---------------------------------------------------------------

/** บันทึกผล unlock รูปภาพ (ทั้งผ่านและไม่ผ่าน) */
export async function recordPhotoUnlock(
  assetId: number,
  userId: number,
  question: string,
  isPassed: boolean
) {
  const points = isPassed ? 5 : 0;
  const { rows } = await pool.query(
    `INSERT INTO photo_view_verifications (asset_id, user_id, question, is_passed, points_earned)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [assetId, userId, question, isPassed, points]
  );
  if (isPassed && rows.length > 0) {
    await pool.query(
      `UPDATE users SET total_points = total_points + $1 WHERE id = $2`,
      [points, userId]
    );
  }
  return { isPassed, pointsEarned: isPassed ? points : 0, alreadyUnlocked: rows.length === 0 };
}
