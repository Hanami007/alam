/* eslint-disable camelcase */

exports.up = (pgm) => {
  // 1. เพิ่ม password_hash ใน users
  pgm.addColumns('users', {
    password_hash: { type: 'text' },
  }, { ifNotExists: true });

  // 2. สร้าง sessions table
  pgm.createTable('sessions', {
    id:         { type: 'text', primaryKey: true },
    user_id:    { type: 'integer', notNull: true, references: 'users(id)', onDelete: 'cascade' },
    expires_at: { type: 'timestamptz', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  }, { ifNotExists: true });

  // 3. สร้าง point_transactions table
  pgm.createTable('point_transactions', {
    id:           { type: 'serial', primaryKey: true },
    user_id:      { type: 'integer', notNull: true, references: 'users(id)', onDelete: 'cascade' },
    points:       { type: 'integer', notNull: true },
    reason:       { type: 'text', notNull: true },
    reference_id: { type: 'text' },
    created_at:   { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  }, { ifNotExists: true });
};

exports.down = (pgm) => {
  pgm.dropTable('point_transactions', { ifExists: true });
  pgm.dropTable('sessions', { ifExists: true });
  pgm.dropColumns('users', ['password_hash'], { ifExists: true });
};
