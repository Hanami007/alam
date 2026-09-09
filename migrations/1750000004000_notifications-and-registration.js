/* eslint-disable camelcase */

/**
 * Migration 004 — Notifications and Registration Enhancements
 * 
 * - สร้างตาราง notifications สำหรับแจ้งเตือนผู้ใช้/แอดมิน/เพื่อนร่วมรุ่น
 * - เพิ่มคอลัมน์ admission_year ใน users
 * - เพิ่ม index ต่างๆ เพื่อประสิทธิภาพ
 */

exports.up = (pgm) => {
  // 1. เพิ่ม admission_year ใน users (ถ้ายังไม่มี)
  pgm.addColumns('users', {
    admission_year: { type: 'integer' },
  }, { ifNotExists: true });

  // 2. สร้าง notifications table
  pgm.createTable('notifications', {
    id:           { type: 'serial', primaryKey: true },
    user_id:      { type: 'integer', notNull: true, references: 'users(id)', onDelete: 'cascade' },
    type:         { type: 'text', notNull: true }, // 'batchmate_pending' | 'admin_pending' | 'user_approved' | 'system' | 'comment'
    title:        { type: 'text', notNull: true },
    message:      { type: 'text', notNull: true },
    link:         { type: 'text' },
    reference_id: { type: 'text' },
    is_read:      { type: 'boolean', notNull: true, default: false },
    created_at:   { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  }, { ifNotExists: true });

  pgm.createIndex('notifications', 'user_id');
  pgm.createIndex('notifications', ['user_id', 'is_read']);
  pgm.createIndex('notifications', 'created_at');
};

exports.down = (pgm) => {
  pgm.dropTable('notifications', { ifExists: true });
  pgm.dropColumns('users', ['admission_year'], { ifExists: true });
};
