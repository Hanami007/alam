/* eslint-disable camelcase */

/**
 * Migration 014 — HOF Quarterly Cycle + Public API Key
 *
 * เพิ่ม:
 * 1. hof_campaigns — คอลัมน์สำหรับระบบรอบ 3 เดือน
 * 2. hof_results — Snapshot TOP 10 เมื่อปิดรอบ (ดูย้อนหลังได้ตลอด)
 * 3. audit_logs  — บันทึกการกระทำของ admin (แก้ bug: โค้ดมีอยู่แล้วแต่ตารางไม่มี)
 * 4. system_settings — เก็บ PUBLIC_API_KEY สำหรับ /api/public/*
 */

exports.up = (pgm) => {
  // ─── 1. เพิ่มคอลัมน์ใน hof_campaigns ─────────────────────────────────────
  pgm.addColumns('hof_campaigns', {
    cycle_number:  { type: 'integer' },                  // รอบที่ 1, 2, 3...
    quarter:       { type: 'text' },                      // 'Q1/2569', 'Q2/2569'...
    period_start:  { type: 'date' },                      // วันเริ่มต้นรอบ
    period_end:    { type: 'date' },                      // วันสิ้นสุดรอบ
    auto_close_at: { type: 'timestamptz' },               // ปิดอัตโนมัติ
    finalized_at:  { type: 'timestamptz' },               // เวลาที่ lock ผล TOP 10
  }, { ifNotExists: true });

  // ─── 2. hof_results — Snapshot TOP 10 เมื่อปิดรอบ ────────────────────────
  pgm.createTable('hof_results', {
    id:                   { type: 'serial',      primaryKey: true },
    campaign_id:          { type: 'integer',     notNull: true, references: 'hof_campaigns(id)', onDelete: 'CASCADE' },
    candidate_id:         { type: 'integer',     notNull: true, references: 'hof_candidates(id)' },
    user_id:              { type: 'integer',     notNull: true, references: 'users(id)' },
    rank:                 { type: 'integer',     notNull: true },   // 1-10
    total_votes:          { type: 'integer',     notNull: true, default: 0 },
    total_points:         { type: 'integer',     notNull: true, default: 0 },
    // Snapshot ข้อมูล ณ วันประกาศ — ไม่เปลี่ยนแม้ user แก้โปรไฟล์ภายหลัง
    snapshot_name:        { type: 'text',        notNull: true },
    snapshot_avatar:      { type: 'text' },
    snapshot_company:     { type: 'text' },
    snapshot_position:    { type: 'text' },
    snapshot_generation:  { type: 'text' },
    snapshot_achievement: { type: 'text' },
    finalized_at:         { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  }, { ifNotExists: true });

  pgm.addConstraint('hof_results', 'hof_results_unique_rank_per_campaign',
    'UNIQUE (campaign_id, rank)');
  pgm.createIndex('hof_results', 'campaign_id');
  pgm.createIndex('hof_results', ['campaign_id', 'rank']);

  // ─── 3. audit_logs — แก้ bug: โค้ด admin.service.ts INSERT มานาน แต่ตารางไม่เคยมี ─
  pgm.createTable('audit_logs', {
    id:          { type: 'serial',      primaryKey: true },
    actor_id:    { type: 'integer',     references: 'users(id)', onDelete: 'SET NULL' },
    action:      { type: 'text',        notNull: true },
    target_type: { type: 'text' },
    target_id:   { type: 'integer' },
    metadata:    { type: 'jsonb',       default: pgm.func("'{}'::jsonb") },
    created_at:  { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  }, { ifNotExists: true });

  // audit_logs ถูกสร้างไปแล้วจริงตั้งแต่ migration 001 (production-hardening) พร้อม index บน
  // actor_id/created_at อยู่แล้ว — CREATE TABLE ด้านบนใช้ ifNotExists จึงไม่พังตอน table ซ้ำ แต่
  // createIndex เดิมไม่ได้ guard ไว้ ชนกับ index ชื่อเดียวกันที่มีอยู่แล้ว (audit_logs_actor_id_index,
  // audit_logs_created_at_index) ทำให้ migration รันไม่ผ่านเลย เพิ่ม ifNotExists ให้ทุกตัว
  pgm.createIndex('audit_logs', 'actor_id', { ifNotExists: true });
  pgm.createIndex('audit_logs', 'action', { ifNotExists: true });
  pgm.createIndex('audit_logs', 'created_at', { ifNotExists: true });

  // ─── 4. system_settings — key-value store สำหรับ config ───────────────────
  pgm.createTable('system_settings', {
    key:        { type: 'text', primaryKey: true },
    value:      { type: 'text', notNull: true },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  }, { ifNotExists: true });

  // ใส่ค่า default PUBLIC_API_KEY (ควรเปลี่ยนผ่าน admin หลัง deploy)
  pgm.sql(`
    INSERT INTO system_settings (key, value)
    VALUES ('public_api_key', 'CHANGE_ME_BEFORE_PRODUCTION')
    ON CONFLICT (key) DO NOTHING;
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('audit_logs',      { ifExists: true });
  pgm.dropTable('hof_results',     { ifExists: true });
  pgm.dropTable('system_settings', { ifExists: true });
  pgm.dropColumns('hof_campaigns', [
    'cycle_number', 'quarter', 'period_start', 'period_end', 'auto_close_at', 'finalized_at',
  ], { ifExists: true });
};
