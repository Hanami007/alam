/* eslint-disable camelcase */

/**
 * Migration 013 — Login Attempts (brute-force protection)
 *
 * /api/auth/login had no rate limiting at all — any identifier's password could
 * be guessed with unlimited attempts. Tracks each login attempt (success or
 * failure) so src/lib/auth.ts can block an identifier after too many recent
 * failures, mirroring the existing DB-based rate limiter already used for post
 * creation (FeedDbService.assertNotRateLimited).
 */

exports.up = (pgm) => {
  pgm.createTable('login_attempts', {
    id: { type: 'serial', primaryKey: true },
    identifier: { type: 'text', notNull: true },
    success: { type: 'boolean', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('login_attempts', ['identifier', 'created_at']);
};

exports.down = (pgm) => {
  pgm.dropTable('login_attempts');
};
