/* eslint-disable camelcase */

/**
 * ลบ index ที่ซ้ำซ้อน (ต่อจาก migration 1750000015000_drop-duplicate-indexes.js)
 *
 * 1. ซ้ำกันตรงตัว (คอลัมน์เดียวกันทุกอย่าง) — เก็บตัวที่ migration สร้าง/ตัวที่เป็น constraint ไว้
 *    - idx_notifications_user_id, idx_photo_tags_user, idx_poll_votes_poll_id,
 *      idx_post_interactions_post_id: ไม่มีที่มาใน repo (มีคนสร้างตรงใน DB) ซ้ำกับ index ของ migration
 *    - lookup_options_category_code_idx: ซ้ำกับ UNIQUE constraint lookup_options_category_code_uq
 *      (migration 016) — ต้องรอลบตรงนี้ เพราะ migration 005/008/009 ใช้ ON CONFLICT ที่พึ่ง index นี้อยู่
 *    - hof_results_campaign_id_rank_index: ซ้ำกับ UNIQUE constraint hof_results_unique_rank_per_campaign
 *
 * 2. index คอลัมน์เดียวที่ index หลายคอลัมน์ (ขึ้นต้นด้วยคอลัมน์เดียวกัน) ครอบคลุมอยู่แล้ว
 *    - lookup_options(category)        ← UNIQUE (category, code)
 *    - hof_results(campaign_id)        ← UNIQUE (campaign_id, rank)
 *    - hof_votes(campaign_id)          ← UNIQUE (campaign_id, voter_id, vote_category)
 *    - photo_tags(asset_id)            ← UNIQUE (asset_id, tagged_user_id)
 *    - poll_votes(poll_id)             ← UNIQUE (poll_id, user_id)
 *
 * ใช้ ifExists ทุกตัว เพราะ index ที่สร้างตรงใน DB อาจไม่มีในเครื่องอื่น
 */

const DROPS = [
  ['notifications', 'idx_notifications_user_id'],
  ['photo_tags', 'idx_photo_tags_user'],
  ['poll_votes', 'idx_poll_votes_poll_id'],
  ['post_interactions', 'idx_post_interactions_post_id'],
  ['lookup_options', 'lookup_options_category_code_idx'],
  ['hof_results', 'hof_results_campaign_id_rank_index'],
  ['lookup_options', 'lookup_options_category_index'],
  ['hof_results', 'hof_results_campaign_id_index'],
  ['hof_votes', 'hof_votes_campaign_id_index'],
  ['photo_tags', 'photo_tags_asset_id_index'],
  ['poll_votes', 'poll_votes_poll_id_index'],
];

exports.up = (pgm) => {
  for (const [table, name] of DROPS) {
    pgm.dropIndex(table, [], { name, ifExists: true });
  }
};

exports.down = (pgm) => {
  // สร้างคืนเฉพาะ index ที่ migration เคยสร้าง (ตัว idx_* ไม่เคยอยู่ใน repo)
  // เพื่อให้ down ของ migration 001 / 014 ลบ index ตามชื่อเดิมได้
  pgm.createIndex('lookup_options', ['category', 'code'], { name: 'lookup_options_category_code_idx', unique: true });
  pgm.createIndex('hof_results', ['campaign_id', 'rank']);
  pgm.createIndex('lookup_options', 'category');
  pgm.createIndex('hof_results', 'campaign_id');
  pgm.createIndex('hof_votes', 'campaign_id');
  pgm.createIndex('photo_tags', 'asset_id');
  pgm.createIndex('poll_votes', 'poll_id');
};
