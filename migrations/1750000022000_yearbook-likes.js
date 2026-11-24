/* eslint-disable camelcase */

/**
 * การกดถูกใจในหนังสือรุ่น
 *
 * เดิมปุ่มหัวใจในหนังสือรุ่นเก็บแค่ใน state ของหน้าเว็บ และยอดตั้งต้นเป็นเลขสมมติ (15 + ลำดับ × 3)
 * รีเฟรชแล้วหาย คนอื่นไม่เห็น — ตารางนี้เก็บจริง คนละ 1 ครั้งต่อหนังสือรุ่นของแต่ละคน
 *
 * user_id  = เจ้าของหน้าหนังสือรุ่นที่ถูกกดถูกใจ
 * liked_by = คนที่กดถูกใจ (ตาม docs/DB_NAMING_CONVENTION.md: user ที่ทำการกระทำ → <กริยาช่อง 3>_by)
 * ลบผู้ใช้คนใดคนหนึ่ง → ลบการกดถูกใจที่เกี่ยวข้องตามไปด้วย
 */

exports.up = (pgm) => {
  pgm.createTable('yearbook_likes', {
    id:         { type: 'serial', primaryKey: true },
    user_id:    { type: 'integer', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    liked_by:   { type: 'integer', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  }, { ifNotExists: true });

  pgm.addConstraint('yearbook_likes', 'yearbook_likes_user_liked_by_uq', 'UNIQUE (user_id, liked_by)');
  pgm.addConstraint('yearbook_likes', 'chk_yearbook_likes_not_self', 'CHECK (user_id <> liked_by)');
  pgm.createIndex('yearbook_likes', 'liked_by');
};

exports.down = (pgm) => {
  pgm.dropTable('yearbook_likes', { ifExists: true });
};
