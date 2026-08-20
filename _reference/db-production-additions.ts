/**
 * _reference/db-production-additions.ts
 *
 * ฟังก์ชันเพิ่มเติมสำหรับ production — เน้นด้าน:
 * - Admin tools (audit log, user management)
 * - Direct post creation by admin
 * - Leaderboard/ranking
 * - Map data enriched
 * - Profile update with privacy controls
 */

import { Pool } from 'pg';
declare const pool: Pool;

// ---------------------------------------------------------------
// Admin: สร้างโพสต์โดยตรง (ไม่ผ่านระบบ request)
// ---------------------------------------------------------------
export async function createPost(
  adminId: number,
  data: { category: string; title: string; content: string; pinned?: boolean }
) {
  const { rows } = await pool.query(
    `INSERT INTO posts (admin_id, category, title, content, post_type, status, pinned, published_at)
     VALUES ($1, $2, $3, $4, 'normal', 'published', $5, now())
     RETURNING *`,
    [adminId, data.category, data.title, data.content, data.pinned ?? false]
  );
  await pool.query(
    `INSERT INTO audit_logs (actor_id, action, target_type, target_id)
     VALUES ($1, 'create_post', 'post', $2)`,
    [adminId, rows[0].id]
  );
  return rows[0];
}

/** ลบโพสต์ (admin only) */
export async function deletePost(postId: number, adminId: number) {
  const { rows } = await pool.query(
    `DELETE FROM posts WHERE id = $1 RETURNING id, title`,
    [postId]
  );
  if (rows.length > 0) {
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, target_type, target_id)
       VALUES ($1, 'delete_post', 'post', $2)`,
      [adminId, postId]
    );
  }
  return rows[0] ?? null;
}

/** Toggle pin สำหรับ admin */
export async function togglePostPin(postId: number) {
  const { rows } = await pool.query(
    `UPDATE posts SET pinned = NOT pinned WHERE id = $1 RETURNING id, pinned`,
    [postId]
  );
  return rows[0] ?? null;
}

// ---------------------------------------------------------------
// Admin: User management
// ---------------------------------------------------------------

/** ดึงผู้ใช้ทั้งหมด พร้อม filter */
export async function getAllUsers(opts?: {
  status?: 'pending' | 'approved' | 'rejected';
  role?: 'alumni' | 'admin';
  generationId?: number;
}) {
  const filters: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (opts?.status)      { filters.push(`u.status = $${i++}`);              params.push(opts.status); }
  if (opts?.role)        { filters.push(`u.role = $${i++}`);                params.push(opts.role); }
  if (opts?.generationId){ filters.push(`u.generation_option_id = $${i++}`);params.push(opts.generationId); }

  const where = filters.length > 0 ? 'WHERE ' + filters.join(' AND ') : '';

  const { rows } = await pool.query(
    `SELECT u.id, u.student_id, u.name, u.email, u.role, u.status,
            u.total_points, u.student_status, u.created_at,
            gen.label AS generation
     FROM users u
     LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
     ${where}
     ORDER BY u.created_at DESC`,
    params
  );
  return rows;
}

// ---------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------

/** ดึง audit logs (admin) */
export async function getAuditLogs(limit = 50) {
  const { rows } = await pool.query(
    `SELECT al.id, al.action, al.target_type, al.target_id, al.metadata, al.created_at,
            u.name AS actor_name
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.actor_id
     ORDER BY al.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

// ---------------------------------------------------------------
// Map: enriched data
// ---------------------------------------------------------------

/** สรุปจำนวน alumni ต่อจังหวัด แยกตาม hometown/workplace */
export async function getProvinceAlumniCount(type: 'hometown' | 'workplace') {
  const col = type === 'hometown' ? 'hometown_province_id' : 'work_province_id';
  const showCol = type === 'hometown' ? 'show_hometown_on_map' : 'show_workplace_on_map';

  const { rows } = await pool.query(
    `SELECT lo.id AS province_id, lo.code, lo.label AS province_name,
            lo.extra->>'region' AS region,
            (lo.extra->>'metro')::boolean AS metro,
            COUNT(u.id)::int AS alumni_count
     FROM lookup_options lo
     LEFT JOIN users u ON u.${col} = lo.id
       AND u.${showCol} = true
       AND u.status = 'approved'
     WHERE lo.category = 'province'
     GROUP BY lo.id, lo.code, lo.label, lo.extra
     ORDER BY alumni_count DESC`,
    []
  );
  return rows;
}

// ---------------------------------------------------------------
// Settings / Privacy
// ---------------------------------------------------------------

/** อัปเดต map privacy settings */
export async function updateMapPrivacy(
  userId: number,
  opts: { showHometownOnMap?: boolean; showWorkplaceOnMap?: boolean }
) {
  const fields: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (opts.showHometownOnMap  !== undefined) { fields.push(`show_hometown_on_map = $${i++}`);  params.push(opts.showHometownOnMap); }
  if (opts.showWorkplaceOnMap !== undefined) { fields.push(`show_workplace_on_map = $${i++}`); params.push(opts.showWorkplaceOnMap); }
  if (fields.length === 0) return null;

  params.push(userId);
  const { rows } = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING id, show_hometown_on_map, show_workplace_on_map`,
    params
  );
  return rows[0] ?? null;
}

/** อัปเดต avatar_url */
export async function updateAvatar(userId: number, avatarUrl: string) {
  const { rows } = await pool.query(
    `UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, avatar_url`,
    [avatarUrl, userId]
  );
  return rows[0] ?? null;
}

// ---------------------------------------------------------------
// Gallery: user gallery
// ---------------------------------------------------------------

/** ดึง user gallery ของคนนั้น (owner_type = 'user_gallery') */
export async function getUserGallery(userId: number) {
  const { rows } = await pool.query(
    `SELECT id, image_url, caption, sort_order, created_at
     FROM media_assets
     WHERE owner_type = 'user_gallery' AND owner_id = $1
     ORDER BY sort_order ASC, created_at DESC`,
    [userId]
  );
  return rows;
}

/** เพิ่มรูปเข้า user gallery */
export async function addUserGalleryImage(
  userId: number,
  imageUrl: string,
  caption?: string
) {
  const { rows } = await pool.query(
    `INSERT INTO media_assets (owner_type, owner_id, uploaded_by, image_url, caption)
     VALUES ('user_gallery', $1, $1, $2, $3)
     RETURNING *`,
    [userId, imageUrl, caption ?? null]
  );
  return rows[0];
}

// ---------------------------------------------------------------
// Post: single post fetch
// ---------------------------------------------------------------

/** ดึง post เดี่ยว พร้อม interactions */
export async function getPostById(postId: number) {
  const { rows } = await pool.query(
    `SELECT p.id, p.category, p.title, p.content, p.pinned, p.status,
            p.post_type, p.created_at, p.published_at,
            COALESCE(a.name, r.name) AS author
     FROM posts p
     LEFT JOIN users a ON a.id = p.admin_id
     LEFT JOIN users r ON r.id = p.requested_by
     WHERE p.id = $1`,
    [postId]
  );
  return rows[0] ?? null;
}
