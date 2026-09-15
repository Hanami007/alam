/* eslint-disable camelcase */

/**
 * Migration 007 — Yearbook Columns
 *
 * เมนู "หนังสือรุ่น" ไม่มีตารางของตัวเอง เก็บอยู่ใน users ทั้งหมด แต่ขาด 2 คอลัมน์
 * ที่โค้ดแอปอ้างถึงอยู่แล้ว:
 *
 * - users.nickname: /api/admin/yearbook (GET/POST/PUT) และฟอร์มแก้ไขใน
 *   yearbook-grid.tsx อ้างคอลัมน์นี้ตรงๆ แต่ไม่เคยถูกสร้างเลยในทุก migration
 *   ที่ผ่านมา — ทุก query ที่แตะ u.nickname จึงพังด้วย
 *   "column u.nickname does not exist"
 * - users.is_available_for_mentorship: มีอยู่จริงใน DB dev (ถูกเพิ่มตรงๆ นอก
 *   migration ตอนไหนไม่ทราบ) แต่ไม่เคยถูก track ใน migrations เลย —
 *   ทำให้ DB ใหม่จาก `npm run migrate:up` จะไม่มีคอลัมน์นี้ ใช้ ifNotExists
 *   กันพังทั้งบน DB ที่มีคอลัมน์นี้อยู่แล้วและ DB ใหม่ที่ยังไม่มี
 */

exports.up = (pgm) => {
  pgm.addColumns('users', {
    nickname: { type: 'text' },
    is_available_for_mentorship: { type: 'boolean', notNull: true, default: false },
  }, { ifNotExists: true });
};

exports.down = (pgm) => {
  pgm.dropColumns('users', ['nickname', 'is_available_for_mentorship'], { ifExists: true });
};
