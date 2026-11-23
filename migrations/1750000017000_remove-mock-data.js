/* eslint-disable camelcase */

/**
 * Migration 017 — ลบข้อมูลจำลอง (mock data) ทั้งหมดออกจาก DB ที่เคย seed ไปแล้ว
 *
 * migration 002 / 008 / 010 และ db/init.sql เคยใส่คนสมมติ โพสต์ โพล Hall of Fame และรูปภาพ
 * ตัวอย่างไว้ ตอนนี้ไฟล์เหล่านั้นถูกตัดส่วน mock ออกแล้ว (fresh DB จะไม่มี mock อีก)
 * migration นี้มีไว้ล้างของเก่าใน DB ที่รัน seed ไปแล้วเท่านั้น
 *
 * ระบุ mock จาก:
 * - users: อีเมล @example.edu (ชุด migration 002) และ seed-hof-% / seed-yearbook-% (ชุด migration 008)
 *   หมายเหตุ: คน mock บางคนใน 008 ใช้ student_id ซ้ำกับชุด 002 จึงยังเป็นอีเมล @example.edu อยู่
 * - posts / polls / hof_campaigns / media_assets: ชื่อเรื่อง/คำบรรยายตรงตามที่ seed ไว้
 * - generations รุ่น 38–48: เพิ่มมาเพื่อคนสมมติเท่านั้น (ปีเข้าไม่ตรงกับสูตรรหัสนักศึกษาจริง)
 *
 * ไม่แตะบัญชีแอดมิน, จังหวัด, ประเภทอาชีพ, อีโมจิ และรุ่น 1–35 (ข้อมูลอ้างอิงจริงของระบบ)
 * ลำดับการลบอ้างอิงตาม AdminService.deleteUser (src/modules/admin/services/admin.service.ts)
 */

const MOCK_POST_TITLES = [
  'ขอเชิญร่วมงานคืนสู่เหย้าประจำปี 2569',
  'อยากได้ธีมงานคืนสู่เหย้าแบบไหน?',
  // ชุด seed ใช้ requested_by เป็นคน mock แต่ใน DB บางเครื่องถูกเปลี่ยนเป็นแอดมินไปแล้ว จึงต้องจับจากชื่อเรื่องด้วย
  'ขอเชิญร่วมบริจาคหนังสือให้ห้องสมุด',
];

const MOCK_ARCHIVE_CAPTIONS = ['พิธีรับปริญญา รุ่น 43', 'ทริปเพื่อนกลุ่ม IT รุ่น 46'];

const MOCK_GENERATION_CODES = ['gen-38', 'gen-40', 'gen-41', 'gen-42', 'gen-43', 'gen-44', 'gen-45', 'gen-46', 'gen-48'];

/**
 * migration 1750000017000_naming-convention-and-field-sizes (ชื่อไฟล์เรียงก่อนไฟล์นี้) เปลี่ยนชื่อ
 * posts.admin_id → published_by และ user_verifications.admin_id → verified_by
 * DB ที่รันไฟล์นั้นไปแล้วจะไม่มี admin_id — เลือกชื่อคอลัมน์ที่มีอยู่จริงแทนการ hardcode
 */
async function pickColumn(pgm, table, candidates) {
  const { rows } = await pgm.db.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = current_schema() AND table_name = $1 AND column_name = ANY($2::text[])`,
    [table, candidates]
  );
  const found = candidates.find((c) => rows.some((r) => r.column_name === c));
  if (!found) throw new Error(`ไม่พบคอลัมน์ ${candidates.join('/')} ในตาราง ${table}`);
  return found;
}

exports.up = async (pgm) => {
  const postsAdminCol = await pickColumn(pgm, 'posts', ['admin_id', 'published_by']);
  const verificationAdminCol = await pickColumn(pgm, 'user_verifications', ['admin_id', 'verified_by']);

  await pgm.db.query(`
    CREATE TEMP TABLE mock_users ON COMMIT DROP AS
    SELECT id FROM users
    WHERE role <> 'admin'
      AND (email LIKE '%@example.edu' OR email LIKE 'seed-hof-%' OR email LIKE 'seed-yearbook-%')
  `);

  await pgm.db.query(
    `CREATE TEMP TABLE mock_posts ON COMMIT DROP AS
     SELECT id FROM posts
     WHERE requested_by IN (SELECT id FROM mock_users) OR title = ANY($1::text[])`,
    [MOCK_POST_TITLES]
  );

  // ─── 1. โพสต์/โพล mock (poll_options, poll_votes, post_interactions cascade ตามไป) ──
  await pgm.db.query(
    `UPDATE posts SET ${postsAdminCol} = NULL WHERE ${postsAdminCol} IN (SELECT id FROM mock_users)`
  );
  await pgm.db.query(`DELETE FROM polls WHERE post_id IN (SELECT id FROM mock_posts)`);
  await pgm.db.query(`DELETE FROM posts WHERE id IN (SELECT id FROM mock_posts)`);

  // ─── 2. กิจกรรมของคน mock บนข้อมูลของคนอื่น ─────────────────────────────────
  await pgm.db.query(`DELETE FROM post_interactions WHERE user_id IN (SELECT id FROM mock_users)`);
  await pgm.db.query(`DELETE FROM poll_votes WHERE user_id IN (SELECT id FROM mock_users)`);
  await pgm.db.query(`DELETE FROM hof_votes WHERE voter_id IN (SELECT id FROM mock_users)`);

  // ─── 3. Hall of Fame ────────────────────────────────────────────────────────
  await pgm.db.query(`
    DELETE FROM hof_results
    WHERE user_id IN (SELECT id FROM mock_users)
       OR candidate_id IN (SELECT id FROM hof_candidates WHERE user_id IN (SELECT id FROM mock_users))
  `);
  await pgm.db.query(`DELETE FROM hof_candidates WHERE user_id IN (SELECT id FROM mock_users)`);
  // แคมเปญ mock: ลบเฉพาะเมื่อไม่เหลือผู้สมัคร/โหวตจริงผูกอยู่ (กันลบแคมเปญที่แอดมินเอาไปใช้ต่อ)
  await pgm.db.query(`
    DELETE FROM hof_campaigns c
    WHERE c.title = 'ศิษย์เก่าดีเด่นประจำปี 2569'
      AND NOT EXISTS (SELECT 1 FROM hof_candidates WHERE campaign_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM hof_votes WHERE campaign_id = c.id)
  `);

  // ─── 4. รูปภาพ (photo_tags, photo_view_verifications cascade ตามไป) ──────────
  await pgm.db.query(
    `DELETE FROM media_assets
     WHERE uploaded_by IN (SELECT id FROM mock_users)
        OR (owner_type = 'user_gallery' AND owner_id IN (SELECT id FROM mock_users))
        -- รูปแกลเลอรีที่เจ้าของถูกลบไปก่อนหน้าแล้ว (owner_id ไม่มี FK จึงค้างอยู่)
        OR (owner_type = 'user_gallery' AND NOT EXISTS (SELECT 1 FROM users WHERE id = media_assets.owner_id))
        OR (owner_type = 'photo_archive' AND caption = ANY($1::text[]))`,
    [MOCK_ARCHIVE_CAPTIONS]
  );
  await pgm.db.query(`
    DELETE FROM photo_tags
    WHERE tagged_user_id IN (SELECT id FROM mock_users) OR tagged_by IN (SELECT id FROM mock_users)
  `);
  await pgm.db.query(`DELETE FROM photo_view_verifications WHERE user_id IN (SELECT id FROM mock_users)`);

  // ─── 5. ตัวคน mock (sessions, point_transactions, notifications cascade ตามไป) ──
  await pgm.db.query(
    `UPDATE user_verifications SET ${verificationAdminCol} = NULL WHERE ${verificationAdminCol} IN (SELECT id FROM mock_users)`
  );
  await pgm.db.query(`DELETE FROM user_verifications WHERE user_id IN (SELECT id FROM mock_users)`);
  await pgm.db.query(`DELETE FROM users WHERE id IN (SELECT id FROM mock_users)`);

  // ─── 6. รุ่นที่เพิ่มมาเพื่อคน mock (ลบเฉพาะที่ไม่มีใครใช้แล้ว) ─────────────────
  await pgm.db.query(
    `DELETE FROM lookup_options lo
     WHERE lo.category = 'generation' AND lo.code = ANY($1::text[])
       AND NOT EXISTS (SELECT 1 FROM users WHERE generation_option_id = lo.id)
       AND NOT EXISTS (SELECT 1 FROM media_assets WHERE generation_option_id = lo.id)`,
    [MOCK_GENERATION_CODES]
  );
};

exports.down = () => {
  // ลบข้อมูลจำลองแล้วกู้คืนไม่ได้ (และไม่ควรกู้คืน)
};
