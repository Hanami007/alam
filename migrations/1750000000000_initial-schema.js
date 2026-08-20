/* eslint-disable camelcase */

/**
 * Migration 001 — Initial schema (14 tables)
 * แยกมาจาก db/init.sql เดิม เฉพาะ DDL (ไม่รวม seed data)
 */

exports.up = (pgm) => {
  // ─── 1. lookup_options ──────────────────────────────────────────────────────
  pgm.createTable('lookup_options', {
    id:       { type: 'serial', primaryKey: true },
    category: { type: 'text',   notNull: true },   // generation | province | career_type | emoji
    code:     { type: 'text',   notNull: true },
    label:    { type: 'text',   notNull: true },
    extra:    { type: 'jsonb',  default: pgm.func("'{}'::jsonb") },
  });

  // ─── 2. users ───────────────────────────────────────────────────────────────
  pgm.createTable('users', {
    id:                        { type: 'serial', primaryKey: true },
    student_id:                { type: 'text',    unique: true },
    citizen_id_hash:           { type: 'text' },
    email:                     { type: 'text',    unique: true },
    name:                      { type: 'text',    notNull: true },
    generation_option_id:      { type: 'integer', references: 'lookup_options(id)' },
    province_option_id:        { type: 'integer', references: 'lookup_options(id)' },
    career_option_id:          { type: 'integer', references: 'lookup_options(id)' },
    company:                   { type: 'text' },
    position:                  { type: 'text' },
    bio:                       { type: 'text' },
    avatar_url:                { type: 'text' },
    role:                      { type: 'text',    notNull: true, default: 'alumni' },
    status:                    { type: 'text',    notNull: true, default: 'pending' },
    total_points:              { type: 'integer', notNull: true, default: 0 },
    hometown_province_id:      { type: 'integer', references: 'lookup_options(id)' },
    work_province_id:          { type: 'integer', references: 'lookup_options(id)' },
    show_hometown_on_map:      { type: 'boolean', notNull: true, default: false },
    show_workplace_on_map:     { type: 'boolean', notNull: true, default: false },
    student_status:            { type: 'text',    notNull: true, default: 'studying' },
    expected_graduation_year:  { type: 'integer' },
    created_at:                { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint('users', 'chk_student_status',
    "CHECK (student_status IN ('studying','alumni'))");

  // Admin ได้แค่ 1 คนในระบบ
  pgm.sql(`
    CREATE UNIQUE INDEX one_admin_only ON users ((true)) WHERE role = 'admin';
  `);

  // ─── 3. user_verifications ──────────────────────────────────────────────────
  pgm.createTable('user_verifications', {
    id:          { type: 'serial',      primaryKey: true },
    user_id:     { type: 'integer',     references: 'users(id)' },
    admin_id:    { type: 'integer',     references: 'users(id)' },
    source:      { type: 'text',        notNull: true },
    status:      { type: 'text',        notNull: true },
    remark:      { type: 'text' },
    decided_at:  { type: 'timestamptz', default: pgm.func('now()') },
  });

  // ─── 4. media_assets ────────────────────────────────────────────────────────
  pgm.createTable('media_assets', {
    id:                   { type: 'serial',      primaryKey: true },
    owner_type:           { type: 'text',        notNull: true },
    owner_id:             { type: 'integer' },
    generation_option_id: { type: 'integer',     references: 'lookup_options(id)' },
    uploaded_by:          { type: 'integer',     references: 'users(id)' },
    image_url:            { type: 'text',        notNull: true },
    watermark_url:        { type: 'text' },
    caption:              { type: 'text' },
    sort_order:           { type: 'integer',     default: 0 },
    created_at:           { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  // ─── 5. posts ───────────────────────────────────────────────────────────────
  pgm.createTable('posts', {
    id:           { type: 'serial',      primaryKey: true },
    admin_id:     { type: 'integer',     references: 'users(id)' },
    requested_by: { type: 'integer',     references: 'users(id)' },
    category:     { type: 'text' },
    title:        { type: 'text',        notNull: true },
    content:      { type: 'text' },
    post_type:    { type: 'text',        notNull: true, default: 'normal' },
    status:       { type: 'text',        notNull: true, default: 'published' },
    pinned:       { type: 'boolean',     default: false },
    published_at: { type: 'timestamptz' },
    created_at:   { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint('posts', 'chk_post_status',
    "CHECK (status IN ('pending_request','published','rejected'))");

  // ─── 6. post_interactions ───────────────────────────────────────────────────
  pgm.createTable('post_interactions', {
    id:              { type: 'serial',      primaryKey: true },
    post_id:         { type: 'integer',     references: 'posts(id)' },
    user_id:         { type: 'integer',     references: 'users(id)' },
    type:            { type: 'text',        notNull: true },
    content:         { type: 'text' },
    emoji_option_id: { type: 'integer',     references: 'lookup_options(id)' },
    points_earned:   { type: 'integer',     default: 0 },
    created_at:      { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  // ─── 7. polls ───────────────────────────────────────────────────────────────
  pgm.createTable('polls', {
    id:              { type: 'serial',  primaryKey: true },
    post_id:         { type: 'integer', unique: true, references: 'posts(id)' },
    question:        { type: 'text',   notNull: true },
    points_per_vote: { type: 'integer', notNull: true, default: 0 },
    status:          { type: 'text',   notNull: true, default: 'active' },
  });

  // ─── 8. poll_options ────────────────────────────────────────────────────────
  pgm.createTable('poll_options', {
    id:          { type: 'serial',  primaryKey: true },
    poll_id:     { type: 'integer', references: 'polls(id)' },
    option_text: { type: 'text',   notNull: true },
  });

  // ─── 9. poll_votes ──────────────────────────────────────────────────────────
  pgm.createTable('poll_votes', {
    id:             { type: 'serial',      primaryKey: true },
    poll_id:        { type: 'integer',     references: 'polls(id)' },
    option_id:      { type: 'integer',     references: 'poll_options(id)' },
    user_id:        { type: 'integer',     references: 'users(id)' },
    points_awarded: { type: 'integer',     notNull: true, default: 0 },
    voted_at:       { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('poll_votes', 'poll_votes_unique_voter', 'UNIQUE (poll_id, user_id)');

  // ─── 10. hof_campaigns ──────────────────────────────────────────────────────
  pgm.createTable('hof_campaigns', {
    id:     { type: 'serial', primaryKey: true },
    title:  { type: 'text',  notNull: true },
    status: { type: 'text',  notNull: true, default: 'open' },
  });

  // ─── 11. hof_candidates ─────────────────────────────────────────────────────
  pgm.createTable('hof_candidates', {
    id:          { type: 'serial',  primaryKey: true },
    campaign_id: { type: 'integer', references: 'hof_campaigns(id)' },
    user_id:     { type: 'integer', references: 'users(id)' },
    description: { type: 'text' },
  });

  // ─── 12. hof_votes ──────────────────────────────────────────────────────────
  pgm.createTable('hof_votes', {
    id:            { type: 'serial',      primaryKey: true },
    campaign_id:   { type: 'integer',     references: 'hof_campaigns(id)' },
    voter_id:      { type: 'integer',     references: 'users(id)' },
    candidate_id:  { type: 'integer',     references: 'hof_candidates(id)' },
    vote_category: { type: 'text',        notNull: true },
    points:        { type: 'integer',     notNull: true },
    voted_at:      { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('hof_votes', 'hof_votes_unique_voter_category',
    'UNIQUE (campaign_id, voter_id, vote_category)');

  // ─── 13. photo_tags ─────────────────────────────────────────────────────────
  pgm.createTable('photo_tags', {
    id:             { type: 'serial',  primaryKey: true },
    asset_id:       { type: 'integer', references: 'media_assets(id)' },
    tagged_user_id: { type: 'integer', references: 'users(id)' },
    tagged_by:      { type: 'integer', references: 'users(id)' },
    tag_source:     { type: 'text',    notNull: true, default: 'manual' },
  });
  pgm.addConstraint('photo_tags', 'photo_tags_unique_tag',
    'UNIQUE (asset_id, tagged_user_id)');

  // ─── 14. photo_view_verifications ───────────────────────────────────────────
  pgm.createTable('photo_view_verifications', {
    id:            { type: 'serial',      primaryKey: true },
    asset_id:      { type: 'integer',     references: 'media_assets(id)' },
    user_id:       { type: 'integer',     references: 'users(id)' },
    question:      { type: 'text' },
    is_passed:     { type: 'boolean',     default: false },
    points_earned: { type: 'integer',     default: 0 },
    verified_at:   { type: 'timestamptz', default: pgm.func('now()') },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('photo_view_verifications', { cascade: true });
  pgm.dropTable('photo_tags',               { cascade: true });
  pgm.dropTable('hof_votes',                { cascade: true });
  pgm.dropTable('hof_candidates',           { cascade: true });
  pgm.dropTable('hof_campaigns',            { cascade: true });
  pgm.dropTable('poll_votes',               { cascade: true });
  pgm.dropTable('poll_options',             { cascade: true });
  pgm.dropTable('polls',                    { cascade: true });
  pgm.dropTable('post_interactions',        { cascade: true });
  pgm.dropTable('posts',                    { cascade: true });
  pgm.dropTable('media_assets',             { cascade: true });
  pgm.dropTable('user_verifications',       { cascade: true });
  pgm.sql('DROP INDEX IF EXISTS one_admin_only;');
  pgm.dropTable('users',                    { cascade: true });
  pgm.dropTable('lookup_options',           { cascade: true });
};
