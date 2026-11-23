/* eslint-disable camelcase */

/**
 * ให้สมาชิกที่กรอก Bio ไว้แล้ว ขึ้นหนังสือรุ่น
 *
 * เดิมหน้าสมัครให้กรอก "แนะนำตัวสั้นๆ / สิ่งที่สนใจ (Bio)" แต่ไม่ได้ตั้ง yearbook_published
 * หนังสือรุ่น (/api/admin/yearbook) กรองเฉพาะ yearbook_published = true จึงไม่เคยเห็น Bio นั้นเลย
 * ตอนนี้ /api/auth/register ตั้งค่าให้แล้วเมื่อกรอก Bio มา — migration นี้ปรับบัญชีที่สมัครไปก่อนหน้า
 * ให้เป็นกติกาเดียวกัน
 */

exports.up = (pgm) => {
  pgm.sql(`
    UPDATE users
    SET yearbook_published = true
    WHERE yearbook_published = false
      AND role = 'alumni'
      AND btrim(coalesce(bio, '')) <> ''
  `);
};

exports.down = () => {
  // แยกไม่ได้ว่าใครถูกเปิดโดย migration นี้ หรือกดเผยแพร่เองภายหลัง จึงไม่ย้อนกลับ
};
