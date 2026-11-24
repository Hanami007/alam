/* eslint-disable camelcase */

/**
 * การกดถูกใจ/ส่งอีโมจิให้ความคิดเห็น
 *
 * เดิมปุ่ม "ถูกใจ" ใต้ความคิดเห็นเก็บแค่ใน state ของหน้าเว็บ ไม่มี API/ตาราง —
 * รีเฟรชแล้วหาย และคนอื่นไม่เห็น ตารางนี้เก็บจริง: คนละ 1 อีโมจิต่อความคิดเห็น
 *
 * comment_id อ้าง post_interactions แถวที่ type = 'comment' (ตรวจใน API ก่อนบันทึก)
 * ลบความคิดเห็นหรือผู้ใช้ → ลบการกดถูกใจตามไปด้วย
 * อีโมจิที่อนุญาตอยู่ใน src/lib/reactions.ts
 */

exports.up = (pgm) => {
  pgm.createTable('comment_reactions', {
    id:         { type: 'serial', primaryKey: true },
    comment_id: { type: 'integer', notNull: true, references: 'post_interactions(id)', onDelete: 'CASCADE' },
    user_id:    { type: 'integer', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    emoji:      { type: 'varchar(10)', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  }, { ifNotExists: true });

  pgm.addConstraint('comment_reactions', 'comment_reactions_comment_user_uq', 'UNIQUE (comment_id, user_id)');
  pgm.createIndex('comment_reactions', 'user_id');
};

exports.down = (pgm) => {
  pgm.dropTable('comment_reactions', { ifExists: true });
};
