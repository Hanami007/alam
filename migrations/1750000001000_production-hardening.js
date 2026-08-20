/* eslint-disable camelcase */

/**
 * Migration 002 — Production Hardening
 *
 * เพิ่มประสิทธิภาพและความปลอดภัยของ schema:
 * - Indexes สำคัญสำหรับ query ที่ใช้งานบ่อย
 * - CHECK constraints เพิ่มเติม
 * - updated_at trigger สำหรับ users
 * - Cascade delete rules
 * - audit_logs table
 */

exports.up = (pgm) => {
  // ─── Indexes ────────────────────────────────────────────────────────────────

  // users: ค้นหาตามรุ่น, จังหวัด, role, status
  pgm.createIndex('users', 'generation_option_id');
  pgm.createIndex('users', 'province_option_id');
  pgm.createIndex('users', 'hometown_province_id');
  pgm.createIndex('users', 'work_province_id');
  pgm.createIndex('users', 'role');
  pgm.createIndex('users', 'status');
  pgm.createIndex('users', 'student_status');
  pgm.createIndex('users', ['total_points'], { name: 'users_total_points_desc_idx', method: 'btree' });

  // posts: ค้นหาตาม status, pinned, published_at
  pgm.createIndex('posts', 'status');
  pgm.createIndex('posts', 'pinned');
  pgm.createIndex('posts', 'published_at');
  pgm.createIndex('posts', 'admin_id');

  // post_interactions: join กับ posts และ users บ่อย
  pgm.createIndex('post_interactions', 'post_id');
  pgm.createIndex('post_interactions', 'user_id');
  pgm.createIndex('post_interactions', 'type');

  // media_assets: ค้นหาตาม owner_type + owner_id
  pgm.createIndex('media_assets', ['owner_type', 'owner_id'], { name: 'media_assets_owner_idx' });
  pgm.createIndex('media_assets', 'generation_option_id');
  pgm.createIndex('media_assets', 'uploaded_by');

  // hof: join campaign + candidate
  pgm.createIndex('hof_candidates', 'campaign_id');
  pgm.createIndex('hof_candidates', 'user_id');
  pgm.createIndex('hof_votes', 'campaign_id');
  pgm.createIndex('hof_votes', 'voter_id');
  pgm.createIndex('hof_votes', 'candidate_id');

  // poll_votes
  pgm.createIndex('poll_votes', 'poll_id');
  pgm.createIndex('poll_votes', 'user_id');

  // photo_tags + verifications
  pgm.createIndex('photo_tags', 'asset_id');
  pgm.createIndex('photo_tags', 'tagged_user_id');
  pgm.createIndex('photo_view_verifications', 'asset_id');
  pgm.createIndex('photo_view_verifications', 'user_id');

  // lookup_options: ค้นหาตาม category
  pgm.createIndex('lookup_options', 'category');
  pgm.createIndex('lookup_options', ['category', 'code'], {
    name: 'lookup_options_category_code_idx',
    unique: true,
  });

  // ─── updated_at column + trigger สำหรับ users ────────────────────────────
  pgm.addColumn('users', {
    updated_at: { type: 'timestamptz', default: pgm.func('now()') },
  });

  pgm.sql(`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `);

  // ─── audit_logs table ────────────────────────────────────────────────────
  pgm.createTable('audit_logs', {
    id:          { type: 'serial',      primaryKey: true },
    actor_id:    { type: 'integer',     references: 'users(id)', onDelete: 'SET NULL' },
    action:      { type: 'text',        notNull: true },   // e.g. 'approve_user', 'reject_post'
    target_type: { type: 'text' },                         // e.g. 'user', 'post'
    target_id:   { type: 'integer' },
    metadata:    { type: 'jsonb',       default: pgm.func("'{}'::jsonb") },
    created_at:  { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('audit_logs', 'actor_id');
  pgm.createIndex('audit_logs', ['target_type', 'target_id'], { name: 'audit_logs_target_idx' });
  pgm.createIndex('audit_logs', 'created_at');

  // ─── เพิ่ม on_delete cascade ที่ขาดไป (ทำ via raw SQL เพราะ node-pg-migrate ──
  // ─── ไม่รองรับ alter FK constraint โดยตรง) ──────────────────────────────────
  pgm.sql(`
    -- post_interactions: ลบ post → ลบ interactions ด้วย
    ALTER TABLE post_interactions DROP CONSTRAINT IF EXISTS post_interactions_post_id_fkey;
    ALTER TABLE post_interactions
      ADD CONSTRAINT post_interactions_post_id_fkey
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

    -- poll_options: ลบ poll → ลบ options ด้วย
    ALTER TABLE poll_options DROP CONSTRAINT IF EXISTS poll_options_poll_id_fkey;
    ALTER TABLE poll_options
      ADD CONSTRAINT poll_options_poll_id_fkey
      FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE;

    -- poll_votes: ลบ poll → ลบ votes ด้วย
    ALTER TABLE poll_votes DROP CONSTRAINT IF EXISTS poll_votes_poll_id_fkey;
    ALTER TABLE poll_votes
      ADD CONSTRAINT poll_votes_poll_id_fkey
      FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE;

    -- hof_candidates: ลบ campaign → ลบ candidates ด้วย
    ALTER TABLE hof_candidates DROP CONSTRAINT IF EXISTS hof_candidates_campaign_id_fkey;
    ALTER TABLE hof_candidates
      ADD CONSTRAINT hof_candidates_campaign_id_fkey
      FOREIGN KEY (campaign_id) REFERENCES hof_campaigns(id) ON DELETE CASCADE;

    -- hof_votes: ลบ campaign หรือ candidate → ลบ votes ด้วย
    ALTER TABLE hof_votes DROP CONSTRAINT IF EXISTS hof_votes_campaign_id_fkey;
    ALTER TABLE hof_votes
      ADD CONSTRAINT hof_votes_campaign_id_fkey
      FOREIGN KEY (campaign_id) REFERENCES hof_campaigns(id) ON DELETE CASCADE;

    ALTER TABLE hof_votes DROP CONSTRAINT IF EXISTS hof_votes_candidate_id_fkey;
    ALTER TABLE hof_votes
      ADD CONSTRAINT hof_votes_candidate_id_fkey
      FOREIGN KEY (candidate_id) REFERENCES hof_candidates(id) ON DELETE CASCADE;

    -- photo_tags: ลบ asset → ลบ tags ด้วย
    ALTER TABLE photo_tags DROP CONSTRAINT IF EXISTS photo_tags_asset_id_fkey;
    ALTER TABLE photo_tags
      ADD CONSTRAINT photo_tags_asset_id_fkey
      FOREIGN KEY (asset_id) REFERENCES media_assets(id) ON DELETE CASCADE;

    -- photo_view_verifications: ลบ asset → ลบ verifications ด้วย
    ALTER TABLE photo_view_verifications DROP CONSTRAINT IF EXISTS photo_view_verifications_asset_id_fkey;
    ALTER TABLE photo_view_verifications
      ADD CONSTRAINT photo_view_verifications_asset_id_fkey
      FOREIGN KEY (asset_id) REFERENCES media_assets(id) ON DELETE CASCADE;
  `);

  // ─── CHECK constraints เพิ่มเติม ──────────────────────────────────────────
  pgm.addConstraint('users', 'chk_user_role',
    "CHECK (role IN ('alumni','admin'))");

  pgm.addConstraint('users', 'chk_user_status',
    "CHECK (status IN ('pending','approved','rejected'))");

  pgm.addConstraint('post_interactions', 'chk_interaction_type',
    "CHECK (type IN ('comment','reaction'))");

  pgm.addConstraint('media_assets', 'chk_owner_type',
    "CHECK (owner_type IN ('post','user_gallery','photo_archive'))");

  pgm.addConstraint('photo_tags', 'chk_tag_source',
    "CHECK (tag_source IN ('manual','ai'))");

  pgm.addConstraint('hof_votes', 'chk_vote_category',
    "CHECK (vote_category IN ('same_generation','other_generation'))");

  pgm.addConstraint('hof_campaigns', 'chk_campaign_status',
    "CHECK (status IN ('open','closed'))");

  pgm.addConstraint('polls', 'chk_poll_status',
    "CHECK (status IN ('active','closed'))");
};

exports.down = (pgm) => {
  // ลบ check constraints
  pgm.dropConstraint('polls', 'chk_poll_status');
  pgm.dropConstraint('hof_campaigns', 'chk_campaign_status');
  pgm.dropConstraint('hof_votes', 'chk_vote_category');
  pgm.dropConstraint('photo_tags', 'chk_tag_source');
  pgm.dropConstraint('media_assets', 'chk_owner_type');
  pgm.dropConstraint('post_interactions', 'chk_interaction_type');
  pgm.dropConstraint('users', 'chk_user_status');
  pgm.dropConstraint('users', 'chk_user_role');

  // ลบ cascade FKs (restore หลักๆ)
  pgm.sql(`
    ALTER TABLE photo_view_verifications DROP CONSTRAINT IF EXISTS photo_view_verifications_asset_id_fkey;
    ALTER TABLE photo_tags DROP CONSTRAINT IF EXISTS photo_tags_asset_id_fkey;
    ALTER TABLE hof_votes DROP CONSTRAINT IF EXISTS hof_votes_candidate_id_fkey;
    ALTER TABLE hof_votes DROP CONSTRAINT IF EXISTS hof_votes_campaign_id_fkey;
    ALTER TABLE hof_candidates DROP CONSTRAINT IF EXISTS hof_candidates_campaign_id_fkey;
    ALTER TABLE poll_votes DROP CONSTRAINT IF EXISTS poll_votes_poll_id_fkey;
    ALTER TABLE poll_options DROP CONSTRAINT IF EXISTS poll_options_poll_id_fkey;
    ALTER TABLE post_interactions DROP CONSTRAINT IF EXISTS post_interactions_post_id_fkey;
  `);

  // ลบ audit_logs
  pgm.dropTable('audit_logs', { cascade: true });

  // ลบ trigger + function
  pgm.sql(`
    DROP TRIGGER IF EXISTS users_set_updated_at ON users;
    DROP FUNCTION IF EXISTS set_updated_at();
  `);

  // ลบ updated_at column
  pgm.dropColumn('users', 'updated_at');

  // ลบ indexes (node-pg-migrate จัดการตาม name อัตโนมัติ)
  pgm.dropIndex('lookup_options', ['category', 'code'], { name: 'lookup_options_category_code_idx' });
  pgm.dropIndex('lookup_options', 'category');
  pgm.dropIndex('photo_view_verifications', 'user_id');
  pgm.dropIndex('photo_view_verifications', 'asset_id');
  pgm.dropIndex('photo_tags', 'tagged_user_id');
  pgm.dropIndex('photo_tags', 'asset_id');
  pgm.dropIndex('poll_votes', 'user_id');
  pgm.dropIndex('poll_votes', 'poll_id');
  pgm.dropIndex('hof_votes', 'candidate_id');
  pgm.dropIndex('hof_votes', 'voter_id');
  pgm.dropIndex('hof_votes', 'campaign_id');
  pgm.dropIndex('hof_candidates', 'user_id');
  pgm.dropIndex('hof_candidates', 'campaign_id');
  pgm.dropIndex('media_assets', 'uploaded_by');
  pgm.dropIndex('media_assets', 'generation_option_id');
  pgm.dropIndex('media_assets', ['owner_type', 'owner_id'], { name: 'media_assets_owner_idx' });
  pgm.dropIndex('post_interactions', 'type');
  pgm.dropIndex('post_interactions', 'user_id');
  pgm.dropIndex('post_interactions', 'post_id');
  pgm.dropIndex('posts', 'admin_id');
  pgm.dropIndex('posts', 'published_at');
  pgm.dropIndex('posts', 'pinned');
  pgm.dropIndex('posts', 'status');
  pgm.dropIndex('users', ['total_points'], { name: 'users_total_points_desc_idx' });
  pgm.dropIndex('users', 'student_status');
  pgm.dropIndex('users', 'status');
  pgm.dropIndex('users', 'role');
  pgm.dropIndex('users', 'work_province_id');
  pgm.dropIndex('users', 'hometown_province_id');
  pgm.dropIndex('users', 'province_option_id');
  pgm.dropIndex('users', 'generation_option_id');
};
