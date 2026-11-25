/* eslint-disable camelcase */

/**
 * แก้ข้อมูลตามผลตรวจระบบ (24 พ.ย. 2569)
 *
 * 1. แคมเปญ HOF เปิดค้างได้หลายอัน — route โหวตหยิบ "แคมเปญ open ตัวไหนก็ได้" จึงได้แคมเปญทดสอบ id 1
 *    แทนแคมเปญปัจจุบัน ปิดทุกอันที่ไม่ใช่อันล่าสุด (ไม่ลบ เพราะบางอันมีผู้เข้าชิงผูกอยู่)
 *    แล้วใส่ unique index ให้ DB บังคับว่า open ได้ทีละ 1 แคมเปญ
 * 2. CHECK ซ้ำคอลัมน์ละ 2 ตัว (migration เก่ากับใหม่ต่างเพิ่มไว้) Postgres บังคับทุกตัวพร้อมกัน
 *    ลบตัวเก่าที่กว้างกว่า ให้เหลือตัวที่ตรงกับค่าที่โค้ดใช้จริง
 * 3. "รุ่น 43" (gen-43) เป็นรุ่นจำลองที่ migration 017 ลบไม่ได้เพราะบัญชีแอดมินผูกอยู่
 *    แอดมินไม่ได้สังกัดรุ่น → ตั้งเป็น NULL แล้วลบแถว (ถ้าไม่มีใครใช้แล้ว)
 */

const DUPLICATE_CHECKS = [
  // [ตาราง, ชื่อ constraint ที่ลบ, นิยามเดิม (ไว้คืนตอน down)]
  ['users', 'chk_users_role', "CHECK (role IN ('admin','alumni','student','pending'))"],
  ['users', 'chk_users_status', "CHECK (status IN ('pending','approved','rejected','suspended'))"],
  ['users', 'chk_users_student_status', "CHECK (student_status IN ('alumni','studying','graduated'))"],
  ['posts', 'chk_posts_status', "CHECK (status IN ('draft','pending','pending_request','published','rejected','archived'))"],
  ['post_interactions', 'chk_post_interactions_type', "CHECK (type IN ('like','comment','reaction','share'))"],
];

exports.up = async (pgm) => {
  // ─── 1. แคมเปญ HOF เปิดได้ทีละ 1 ──────────────────────────────────────────────
  await pgm.db.query(`
    UPDATE hof_campaigns SET status = 'closed'
    WHERE status = 'open'
      AND id <> (SELECT MAX(id) FROM hof_campaigns WHERE status = 'open')
  `);
  pgm.createIndex('hof_campaigns', 'status', {
    name: 'hof_campaigns_one_open_uq',
    unique: true,
    where: "status = 'open'",
    ifNotExists: true,
  });

  // ─── 2. CHECK ซ้ำ ────────────────────────────────────────────────────────────
  for (const [table, name] of DUPLICATE_CHECKS) {
    pgm.dropConstraint(table, name, { ifExists: true });
  }

  // ─── 3. รุ่นจำลอง gen-43 ──────────────────────────────────────────────────────
  await pgm.db.query(`
    UPDATE users SET generation_option_id = NULL
    WHERE role = 'admin'
      AND generation_option_id IN (SELECT id FROM lookup_options WHERE category = 'generation' AND code = 'gen-43')
  `);
  await pgm.db.query(`
    DELETE FROM lookup_options lo
    WHERE lo.category = 'generation' AND lo.code = 'gen-43'
      AND NOT EXISTS (SELECT 1 FROM users WHERE generation_option_id = lo.id)
      AND NOT EXISTS (SELECT 1 FROM media_assets WHERE generation_option_id = lo.id)
      AND NOT EXISTS (SELECT 1 FROM nas_photo_tags WHERE generation_option_id = lo.id)
      AND NOT EXISTS (SELECT 1 FROM generation_leaders WHERE generation_option_id = lo.id)
      AND NOT EXISTS (SELECT 1 FROM generation_unlock_questions WHERE generation_option_id = lo.id)
  `);
};

exports.down = (pgm) => {
  pgm.dropIndex('hof_campaigns', 'status', { name: 'hof_campaigns_one_open_uq', ifExists: true });
  for (const [table, name, definition] of DUPLICATE_CHECKS) {
    pgm.addConstraint(table, name, definition);
  }
  // แคมเปญที่ถูกปิด และรุ่นจำลองที่ลบไป ไม่คืนค่า (เป็นข้อมูลค้างจากช่วงทดสอบ)
};
