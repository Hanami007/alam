/* eslint-disable camelcase */

/**
 * หัวหน้ารุ่น + คำถามปลดล็อกคลังภาพของแต่ละรุ่น + เวลาใช้งานล่าสุดของผู้ใช้
 *
 * 1. generation_leaders — "หัวหน้ารุ่น" แยกจาก users.role (สิทธิ์ระบบ) และ users.student_status
 *    (ศิษย์เก่า/ปัจจุบัน) เพราะเป็นตำแหน่งที่ผูกกับรุ่น: รุ่นละ 1 คน, คนละ 1 รุ่น
 *    ศิษย์ปัจจุบันเป็นหัวหน้ารุ่นได้ แอดมินแต่งตั้ง/ถอด (src/modules/member/services/leader.service.ts)
 *    สิทธิ์: อนุมัติสมาชิกใหม่ของรุ่นตัวเอง (แทนเพื่อนร่วมรุ่นทุกคนแบบเดิม) และตั้งคำถามปลดล็อกคลังภาพ
 *
 * 2. generation_unlock_questions — คำถามปลดล็อกคลังภาพรุ่น รุ่นละ 1 คำถาม
 *    เดิมคำถามเขียนตายตัวในโค้ด และไม่ตรวจคำตอบเลย (พิมพ์อะไรก็ผ่าน)
 *    accepted_answers เก็บคำตอบที่ยอมรับได้หลายแบบ (ตรวจแบบไม่สนช่องว่าง/ตัวพิมพ์)
 *
 * 3. users.last_active_at — ใช้นับผู้ใช้ active (ออนไลน์ตอนนี้ / วันนี้ / 7 วัน / 30 วัน)
 *    อัปเดตใน getCurrentUser ไม่เกิน 5 นาทีครั้งต่อคน (src/lib/auth.ts)
 */

exports.up = (pgm) => {
  pgm.createTable('generation_leaders', {
    id:                   { type: 'serial', primaryKey: true },
    generation_option_id: { type: 'integer', notNull: true, unique: true, references: 'lookup_options(id)', onDelete: 'CASCADE' },
    user_id:              { type: 'integer', notNull: true, unique: true, references: 'users(id)', onDelete: 'CASCADE' },
    appointed_by:         { type: 'integer', references: 'users(id)', onDelete: 'SET NULL' },
    appointed_at:         { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  }, { ifNotExists: true });

  pgm.createTable('generation_unlock_questions', {
    id:                   { type: 'serial', primaryKey: true },
    generation_option_id: { type: 'integer', notNull: true, unique: true, references: 'lookup_options(id)', onDelete: 'CASCADE' },
    question:             { type: 'varchar(200)', notNull: true },
    accepted_answers:     { type: 'text[]', notNull: true },
    updated_by:           { type: 'integer', references: 'users(id)', onDelete: 'SET NULL' },
    updated_at:           { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  }, { ifNotExists: true });
  pgm.addConstraint('generation_unlock_questions', 'chk_unlock_answers_not_empty', 'CHECK (cardinality(accepted_answers) > 0)');

  pgm.addColumns('users', {
    last_active_at: { type: 'timestamptz' },
  }, { ifNotExists: true });
  pgm.createIndex('users', 'last_active_at', { ifNotExists: true });
};

exports.down = (pgm) => {
  pgm.dropIndex('users', 'last_active_at', { ifExists: true });
  pgm.dropColumns('users', ['last_active_at'], { ifExists: true });
  pgm.dropTable('generation_unlock_questions', { ifExists: true });
  pgm.dropTable('generation_leaders', { ifExists: true });
};
