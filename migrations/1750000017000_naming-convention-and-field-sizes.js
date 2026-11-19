/* eslint-disable camelcase */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Migration 017 — Naming convention + ขนาดฟิลด์ + ย้ายรูปโปรไฟล์ base64 ออกจาก DB
 * (ข้อ 2 + ข้อ 3 รวมใน migration เดียว — หลักการตั้งชื่อดูที่ docs/DB_NAMING_CONVENTION.md)
 *
 * 1) ย้ายรูป base64 (data:image/...) ใน users.avatar_url และ hof_results.snapshot_avatar
 *    ออกเป็นไฟล์ <UPLOAD_DIR>/avatars/<sha256>.<ext> แล้วเก็บแค่ path /api/uploads/avatars/...
 *    (ตั้งชื่อไฟล์ตาม hash ของเนื้อหา — รันซ้ำได้ และรูปเดียวกันใน snapshot ของ HoF ใช้ไฟล์ร่วมกัน)
 *    ต้องรันใน container ที่ mount ./data/uploads ไว้ (ดู service migrate ใน docker-compose.prod.yml)
 *
 * 2) เปลี่ยนชื่อคอลัมน์ที่สื่อความหมายผิด
 *    - user_verifications.admin_id → verified_by        (เก็บ id ของเพื่อนร่วมรุ่นหรือแอดมินที่ยืนยัน)
 *    - posts.admin_id              → published_by       (คนที่สร้าง/อนุมัติให้โพสต์เผยแพร่)
 *    - media_assets.watermark_url  → original_image_url (เก็บรูปต้นฉบับที่ไม่เบลอ ไม่ใช่รูปลายน้ำ)
 *
 * 3) เปลี่ยน text → varchar(n) ให้ตรงกับขีดจำกัดในหน้าเว็บ (src/lib/field-limits.ts)
 *    ก่อนเปลี่ยนจะตรวจว่ามีข้อมูลเดิมยาวเกินไหม ถ้ามีจะหยุด migration พร้อมบอกคอลัมน์/จำนวนแถว
 *    (ไม่ตัดข้อความทิ้งเองเงียบๆ) ให้แก้ข้อมูลก่อนแล้วรันใหม่
 */

const FIELD_SIZES = [
  // [table, column, max length]
  ['users', 'student_id', 20],
  ['users', 'citizen_id_hash', 128],
  ['users', 'password_hash', 255],
  ['users', 'email', 254],
  ['users', 'name', 100],
  ['users', 'nickname', 50],
  ['users', 'company', 150],
  ['users', 'position', 100],
  ['users', 'bio', 500],
  ['users', 'avatar_url', 255],
  ['users', 'role', 20],
  ['users', 'status', 20],
  ['users', 'student_status', 20],
  ['users', 'facebook_url', 255],
  ['users', 'line_id', 50],

  ['posts', 'category', 50],
  ['posts', 'title', 100],
  ['posts', 'content', 1000],
  ['posts', 'post_type', 20],
  ['posts', 'status', 20],

  ['post_interactions', 'type', 20],
  ['post_interactions', 'content', 500],

  ['polls', 'question', 100],
  ['polls', 'status', 20],
  ['poll_options', 'option_text', 60],

  ['hof_campaigns', 'title', 150],
  ['hof_campaigns', 'status', 20],
  ['hof_candidates', 'description', 500],
  ['hof_results', 'snapshot_name', 100],
  ['hof_results', 'snapshot_avatar', 255],
  ['hof_results', 'snapshot_company', 150],
  ['hof_results', 'snapshot_position', 100],
  ['hof_results', 'snapshot_generation', 100],
  ['hof_results', 'snapshot_achievement', 500],

  ['user_verifications', 'source', 30],
  ['user_verifications', 'status', 20],
  ['user_verifications', 'remark', 500],

  ['media_assets', 'owner_type', 20],
  ['media_assets', 'image_url', 1000],
  ['media_assets', 'original_image_url', 1000],
  ['media_assets', 'caption', 255],

  ['lookup_options', 'category', 30],
  ['lookup_options', 'code', 50],
  ['lookup_options', 'label', 100],

  ['banned_keywords', 'keyword', 50],
];

const RENAMES = [
  // [table, from, to, old index name, new index name]
  ['user_verifications', 'admin_id', 'verified_by', null, null],
  ['posts', 'admin_id', 'published_by', 'posts_admin_id_index', 'posts_published_by_index'],
  ['media_assets', 'watermark_url', 'original_image_url', null, null],
];

const AVATAR_URL_PREFIX = '/api/uploads/avatars/';
const EXT_BY_MIME = { png: 'png', jpeg: 'jpg', jpg: 'jpg', webp: 'webp', gif: 'gif' };

function avatarDir() {
  const root = process.env.UPLOAD_DIR || path.join(process.cwd(), 'data', 'uploads');
  return path.join(root, 'avatars');
}

/** เขียน data URL เป็นไฟล์ คืน path ที่จะเก็บใน DB หรือ null ถ้าไม่ใช่รูปที่อ่านได้ */
function writeDataUrl(dataUrl) {
  const match = /^data:image\/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/=\s]+)$/i.exec(dataUrl);
  if (!match) return null;
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length === 0) return null;
  const ext = EXT_BY_MIME[match[1].toLowerCase()];
  const fileName = `${crypto.createHash('sha256').update(buffer).digest('hex')}.${ext}`;
  const dir = avatarDir();
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, fileName);
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, buffer);
  return `${AVATAR_URL_PREFIX}${fileName}`;
}

async function moveBase64Column(pgm, table, column) {
  const exists = await pgm.db.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
    [table, column]
  );
  if (exists.rows.length === 0) return;

  const { rows } = await pgm.db.query(
    `SELECT id, ${column} AS value FROM ${table} WHERE ${column} LIKE 'data:%'`
  );
  for (const row of rows) {
    // ถ้าอ่านไม่ได้ (data URL เสีย) ให้ล้างเป็น NULL — UI มี fallback รูป default อยู่แล้ว
    const newValue = writeDataUrl(row.value);
    await pgm.db.query(`UPDATE ${table} SET ${column} = $1 WHERE id = $2`, [newValue, row.id]);
  }
  if (rows.length > 0) {
    console.log(`[migration 017] ย้ายรูป base64 ${rows.length} แถวจาก ${table}.${column} ไปที่ ${avatarDir()}`);
  }
}

exports.up = async (pgm) => {
  // ── 1) ย้ายรูป base64 ออกเป็นไฟล์ (pgm.db.query รันทันที ก่อนคำสั่ง pgm.sql ที่ต่อคิวไว้ด้านล่าง)
  await moveBase64Column(pgm, 'users', 'avatar_url');
  await moveBase64Column(pgm, 'hof_results', 'snapshot_avatar');

  // banned_keywords เดิมสร้างเองตอน runtime (admin.service ensureBannedKeywordsTable) —
  // สร้างให้แน่ใจก่อนเปลี่ยนชนิดคอลัมน์
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS banned_keywords (
      id         SERIAL PRIMARY KEY,
      keyword    TEXT NOT NULL,
      added_by   INT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT banned_keywords_keyword_uq UNIQUE (keyword)
    );
  `);

  // ── 2) เปลี่ยนชื่อคอลัมน์
  for (const [table, from, to, oldIndex, newIndex] of RENAMES) {
    pgm.renameColumn(table, from, to);
    if (oldIndex) pgm.sql(`ALTER INDEX IF EXISTS ${oldIndex} RENAME TO ${newIndex};`);
  }

  // ── 3) ตรวจความยาวข้อมูลเดิมก่อนเปลี่ยนชนิด
  const checks = FIELD_SIZES.map(([table, column, max]) => `('${table}', '${column}', ${max})`).join(
    ',\n        '
  );
  pgm.sql(`
    DO $$
    DECLARE
      rec record;
      too_long bigint;
      problems text := '';
    BEGIN
      FOR rec IN SELECT * FROM (VALUES
        ${checks}
      ) AS t(tbl, col, max_len)
      LOOP
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = rec.tbl AND column_name = rec.col) THEN
          EXECUTE format('SELECT count(*) FROM %I WHERE char_length(%I) > %s', rec.tbl, rec.col, rec.max_len)
            INTO too_long;
          IF too_long > 0 THEN
            problems := problems || format(E'\\n  %s.%s: %s แถวยาวเกิน %s ตัวอักษร', rec.tbl, rec.col, too_long, rec.max_len);
          END IF;
        END IF;
      END LOOP;
      IF problems <> '' THEN
        RAISE EXCEPTION 'มีข้อมูลยาวเกินขนาดฟิลด์ใหม่ แก้ข้อมูลก่อนแล้วรัน migration อีกครั้ง:%', problems;
      END IF;
    END $$;
  `);

  // ── 4) text → varchar(n)
  for (const [table, column, max] of FIELD_SIZES) {
    pgm.alterColumn(table, column, { type: `varchar(${max})` });
  }
};

exports.down = (pgm) => {
  for (const [table, column] of FIELD_SIZES) {
    pgm.alterColumn(table, column, { type: 'text' });
  }
  for (const [table, from, to, oldIndex, newIndex] of [...RENAMES].reverse()) {
    if (oldIndex) pgm.sql(`ALTER INDEX IF EXISTS ${newIndex} RENAME TO ${oldIndex};`);
    pgm.renameColumn(table, to, from);
  }
  // ไฟล์รูปที่ย้ายออกไปแล้วไม่แปลงกลับเป็น base64 — path ยังใช้งานได้ตามเดิม
};
