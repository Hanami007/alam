/* eslint-disable camelcase */

/**
 * Migration 006 — Data Integrity Guards
 *
 * Postgres CHECK constraints can't reference other tables, so these three
 * gaps need trigger-based validation instead:
 *
 * 1. lookup_options is a polymorphic dimension table (category + code) —
 *    users.generation_option_id / province_option_id / hometown_province_id /
 *    work_province_id / career_option_id, media_assets.generation_option_id
 *    and post_interactions.emoji_option_id all FK to lookup_options(id) with
 *    no guarantee the referenced row's category matches the column's intent.
 * 2. hof_votes has no guard against a voter voting for their own candidacy.
 * 3. media_assets.owner_id is a polymorphic owner (owner_type + owner_id)
 *    with no real FK, so a deleted user/post can leave orphaned rows behind.
 */

exports.up = (pgm) => {
  // ─── 1. lookup_options category guards ──────────────────────────────────────
  pgm.sql(`
    CREATE OR REPLACE FUNCTION check_users_lookup_categories()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.generation_option_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM lookup_options WHERE id = NEW.generation_option_id AND category = 'generation'
      ) THEN
        RAISE EXCEPTION 'users.generation_option_id (%) must reference a lookup_options row with category=generation', NEW.generation_option_id;
      END IF;

      IF NEW.province_option_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM lookup_options WHERE id = NEW.province_option_id AND category = 'province'
      ) THEN
        RAISE EXCEPTION 'users.province_option_id (%) must reference a lookup_options row with category=province', NEW.province_option_id;
      END IF;

      IF NEW.hometown_province_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM lookup_options WHERE id = NEW.hometown_province_id AND category = 'province'
      ) THEN
        RAISE EXCEPTION 'users.hometown_province_id (%) must reference a lookup_options row with category=province', NEW.hometown_province_id;
      END IF;

      IF NEW.work_province_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM lookup_options WHERE id = NEW.work_province_id AND category = 'province'
      ) THEN
        RAISE EXCEPTION 'users.work_province_id (%) must reference a lookup_options row with category=province', NEW.work_province_id;
      END IF;

      IF NEW.career_option_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM lookup_options WHERE id = NEW.career_option_id AND category = 'career_type'
      ) THEN
        RAISE EXCEPTION 'users.career_option_id (%) must reference a lookup_options row with category=career_type', NEW.career_option_id;
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER users_check_lookup_categories
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION check_users_lookup_categories();

    CREATE OR REPLACE FUNCTION check_media_assets_generation_category()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.generation_option_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM lookup_options WHERE id = NEW.generation_option_id AND category = 'generation'
      ) THEN
        RAISE EXCEPTION 'media_assets.generation_option_id (%) must reference a lookup_options row with category=generation', NEW.generation_option_id;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER media_assets_check_generation_category
    BEFORE INSERT OR UPDATE ON media_assets
    FOR EACH ROW EXECUTE FUNCTION check_media_assets_generation_category();

    CREATE OR REPLACE FUNCTION check_post_interactions_emoji_category()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.emoji_option_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM lookup_options WHERE id = NEW.emoji_option_id AND category = 'emoji'
      ) THEN
        RAISE EXCEPTION 'post_interactions.emoji_option_id (%) must reference a lookup_options row with category=emoji', NEW.emoji_option_id;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER post_interactions_check_emoji_category
    BEFORE INSERT OR UPDATE ON post_interactions
    FOR EACH ROW EXECUTE FUNCTION check_post_interactions_emoji_category();
  `);

  // ─── 2. hof_votes: กันโหวตตัวเอง ─────────────────────────────────────────────
  pgm.sql(`
    CREATE OR REPLACE FUNCTION check_hof_votes_no_self_vote()
    RETURNS TRIGGER AS $$
    DECLARE
      candidate_user_id integer;
    BEGIN
      SELECT user_id INTO candidate_user_id FROM hof_candidates WHERE id = NEW.candidate_id;
      IF candidate_user_id IS NOT NULL AND candidate_user_id = NEW.voter_id THEN
        RAISE EXCEPTION 'hof_votes: voter_id (%) cannot vote for their own candidacy', NEW.voter_id;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER hof_votes_no_self_vote
    BEFORE INSERT OR UPDATE ON hof_votes
    FOR EACH ROW EXECUTE FUNCTION check_hof_votes_no_self_vote();
  `);

  // ─── 3. media_assets.owner_id: validate + cascade cleanup ───────────────────
  pgm.sql(`
    CREATE OR REPLACE FUNCTION check_media_assets_owner()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.owner_type = 'user_gallery' THEN
        IF NEW.owner_id IS NULL OR NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.owner_id) THEN
          RAISE EXCEPTION 'media_assets.owner_id (%) must reference an existing user when owner_type=user_gallery', NEW.owner_id;
        END IF;
      ELSIF NEW.owner_type = 'post' THEN
        IF NEW.owner_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM posts WHERE id = NEW.owner_id) THEN
          RAISE EXCEPTION 'media_assets.owner_id (%) must reference an existing post when owner_type=post', NEW.owner_id;
        END IF;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER media_assets_check_owner
    BEFORE INSERT OR UPDATE ON media_assets
    FOR EACH ROW EXECUTE FUNCTION check_media_assets_owner();

    CREATE OR REPLACE FUNCTION cleanup_media_assets_on_user_delete()
    RETURNS TRIGGER AS $$
    BEGIN
      DELETE FROM media_assets WHERE owner_type = 'user_gallery' AND owner_id = OLD.id;
      RETURN OLD;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER users_cleanup_media_assets
    BEFORE DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION cleanup_media_assets_on_user_delete();

    CREATE OR REPLACE FUNCTION cleanup_media_assets_on_post_delete()
    RETURNS TRIGGER AS $$
    BEGIN
      DELETE FROM media_assets WHERE owner_type = 'post' AND owner_id = OLD.id;
      RETURN OLD;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER posts_cleanup_media_assets
    BEFORE DELETE ON posts
    FOR EACH ROW EXECUTE FUNCTION cleanup_media_assets_on_post_delete();
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TRIGGER IF EXISTS posts_cleanup_media_assets ON posts;
    DROP FUNCTION IF EXISTS cleanup_media_assets_on_post_delete();

    DROP TRIGGER IF EXISTS users_cleanup_media_assets ON users;
    DROP FUNCTION IF EXISTS cleanup_media_assets_on_user_delete();

    DROP TRIGGER IF EXISTS media_assets_check_owner ON media_assets;
    DROP FUNCTION IF EXISTS check_media_assets_owner();

    DROP TRIGGER IF EXISTS hof_votes_no_self_vote ON hof_votes;
    DROP FUNCTION IF EXISTS check_hof_votes_no_self_vote();

    DROP TRIGGER IF EXISTS post_interactions_check_emoji_category ON post_interactions;
    DROP FUNCTION IF EXISTS check_post_interactions_emoji_category();

    DROP TRIGGER IF EXISTS media_assets_check_generation_category ON media_assets;
    DROP FUNCTION IF EXISTS check_media_assets_generation_category();

    DROP TRIGGER IF EXISTS users_check_lookup_categories ON users;
    DROP FUNCTION IF EXISTS check_users_lookup_categories();
  `);
};
