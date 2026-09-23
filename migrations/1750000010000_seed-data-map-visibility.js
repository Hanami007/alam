/* eslint-disable camelcase */

/**
 * Migration 010 — Seed Data Map Visibility
 *
 * migrations/1750000008000_replace-mock-with-seed-data.js seeded 24 real users
 * (tagged email LIKE 'seed-hof-%' / 'seed-yearbook-%') to replace the hardcoded
 * mock arrays in the Hall of Fame and Yearbook components, but never set
 * show_hometown_on_map / show_workplace_on_map — those default to false, so
 * none of them were eligible to appear on the alumni map.
 *
 * That went unnoticed while src/modules/map/services/map.service.ts was still
 * padding every response with ~42 hardcoded fake alumni (removed in this same
 * change) — the map always looked populated regardless of what the DB actually
 * had opted in. With that padding gone, the map would now show close to
 * nothing. These seed rows already have real hometown/work province data (see
 * migration 008), so this just opts them in, matching what the register form
 * itself defaults new signups to.
 */

exports.up = async (pgm) => {
  await pgm.db.query(
    `UPDATE users
     SET show_hometown_on_map = true, show_workplace_on_map = true
     WHERE (email LIKE 'seed-hof-%' OR email LIKE 'seed-yearbook-%')
       AND (hometown_province_id IS NOT NULL OR province_option_id IS NOT NULL OR work_province_id IS NOT NULL)`
  );
};

exports.down = async (pgm) => {
  await pgm.db.query(
    `UPDATE users
     SET show_hometown_on_map = false, show_workplace_on_map = false
     WHERE email LIKE 'seed-hof-%' OR email LIKE 'seed-yearbook-%'`
  );
};
