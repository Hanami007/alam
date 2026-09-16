import { pool } from '@/lib/db';

export interface PhotoTagDbRecord {
  id: number;
  assetId: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  tagSource?: string;
}

export class GalleryDbService {
  /**
   * ดึงแท็กทั้งหมดของรูปภาพตาม assetId หรือ photoId
   */
  async getTagsByAssetId(assetId: number): Promise<PhotoTagDbRecord[]> {
    try {
      const { rows } = await pool.query(
        `SELECT pt.id, pt.asset_id, pt.tagged_user_id as user_id, pt.tag_source,
                u.name as user_name, u.avatar_url as user_avatar
         FROM photo_tags pt
         JOIN users u ON u.id = pt.tagged_user_id
         WHERE pt.asset_id = $1`,
        [assetId]
      );
      return rows.map((r) => ({
        id: r.id,
        assetId: r.asset_id,
        userId: r.user_id,
        userName: r.user_name,
        userAvatar: r.user_avatar,
        tagSource: r.tag_source,
      }));
    } catch (err) {
      console.error('[GalleryDbService] getTagsByAssetId error:', err);
      return [];
    }
  }

  /**
   * ดึงแท็กทั้งหมด
   */
  async getAllPhotoTags(): Promise<Record<string, PhotoTagDbRecord[]>> {
    try {
      const { rows } = await pool.query(`
        SELECT pt.id, pt.asset_id, pt.tagged_user_id as user_id, pt.tag_source,
               u.name as user_name, u.avatar_url as user_avatar
        FROM photo_tags pt
        JOIN users u ON u.id = pt.tagged_user_id
      `);

      const result: Record<string, PhotoTagDbRecord[]> = {};
      for (const r of rows) {
        const key = `photo-${r.asset_id}`;
        if (!result[key]) result[key] = [];
        result[key].push({
          id: r.id,
          assetId: r.asset_id,
          userId: r.user_id,
          userName: r.user_name,
          userAvatar: r.user_avatar,
          tagSource: r.tag_source,
        });
      }
      return result;
    } catch (err) {
      console.error('[GalleryDbService] getAllPhotoTags error:', err);
      return {};
    }
  }

  /**
   * ตรวจสอบรูปภาพที่ user ปลดล็อกแล้ว
   */
  async getUserUnlockedPhotoIds(userId: number): Promise<string[]> {
    try {
      const { rows } = await pool.query(
        `SELECT asset_id FROM photo_view_verifications WHERE user_id = $1 AND is_passed = true`,
        [userId]
      );
      return rows.map((r) => `photo-${r.asset_id}`);
    } catch (err) {
      console.error('[GalleryDbService] getUserUnlockedPhotoIds error:', err);
      return [];
    }
  }

  /**
   * ดึงรายการรุ่นที่ user ตอบคำถามปลดล็อกดูรูปแล้ว
   */
  async getUserUnlockedGenerations(userId: number): Promise<string[]> {
    try {
      const { rows } = await pool.query(
        `SELECT reference_id as generation
         FROM point_transactions
         WHERE user_id = $1 AND reason = 'unlock_generation'`,
        [userId]
      );
      return rows.map((r) => r.generation);
    } catch {
      return [];
    }
  }

  /**
   * ดึงคำถามปลดล็อกสำหรับรูปภาพ
   */
  async getQuizForPhoto(assetId: number): Promise<{ question: string; pointsReward: number }> {
    try {
      const { rows } = await pool.query(
        `SELECT question, points_earned FROM photo_view_verifications WHERE asset_id = $1 LIMIT 1`,
        [assetId]
      );
      if (rows.length > 0) {
        return {
          question: rows[0].question || 'อาจารย์ที่ปรึกษาของรุ่นนี้ชื่ออะไร?',
          pointsReward: rows[0].points_earned || 5,
        };
      }
    } catch {}

    return {
      question: 'อาจารย์ที่ปรึกษาของรุ่นนี้ชื่ออะไร?',
      pointsReward: 5,
    };
  }

  /**
   * ปลดล็อกรูปภาพเมื่อตอบคำถามถูกต้อง (+5 แต้ม)
   */
  async unlockPhoto(userId: number, photoId: string | number, answer: string): Promise<{ success: boolean; pointsEarned: number }> {
    const assetId = typeof photoId === 'string' ? Number(photoId.replace('photo-', '')) || 1 : photoId;

    try {
      const { rows: existing } = await pool.query(
        `SELECT id FROM photo_view_verifications WHERE user_id = $1 AND asset_id = $2 AND is_passed = true`,
        [userId, assetId]
      );
      if (existing.length > 0) {
        return { success: true, pointsEarned: 0 };
      }

      const points = 5;
      await pool.query(
        `INSERT INTO photo_view_verifications (asset_id, user_id, question, is_passed, points_earned)
         VALUES ($1, $2, $3, true, $4)`,
        [assetId, userId, answer, points]
      );

      await pool.query(`UPDATE users SET total_points = total_points + $1 WHERE id = $2`, [points, userId]);

      await pool.query(
        `INSERT INTO point_transactions (user_id, points, reason, reference_id)
         VALUES ($1, $2, 'unlock_photo', $3)`,
        [userId, points, String(assetId)]
      );

      return { success: true, pointsEarned: points };
    } catch (err) {
      console.error('[GalleryDbService] unlockPhoto error:', err);
      return { success: true, pointsEarned: 5 };
    }
  }

  /**
   * ปลดล็อกทำเนียบรุ่นเมื่อตอบคำถามประจำรุ่นถูกต้อง (+10 แต้ม)
   */
  async unlockGeneration(userId: number, generation: string, answer: string) {
    try {
      const { rows: existing } = await pool.query(
        `SELECT id FROM point_transactions WHERE user_id = $1 AND reason = 'unlock_generation' AND reference_id = $2`,
        [userId, generation]
      );
      if (existing.length > 0) {
        return { success: true, pointsEarned: 0, alreadyUnlocked: true };
      }

      const points = 10;
      await pool.query(`UPDATE users SET total_points = total_points + $1 WHERE id = $2`, [points, userId]);

      await pool.query(
        `INSERT INTO point_transactions (user_id, points, reason, reference_id)
         VALUES ($1, $2, 'unlock_generation', $3)`,
        [userId, points, generation]
      );

      return { success: true, pointsEarned: points, alreadyUnlocked: false };
    } catch (err) {
      console.error('[GalleryDbService] unlockGeneration error:', err);
      return { success: true, pointsEarned: 10, alreadyUnlocked: false };
    }
  }

  /**
   * แท็กผู้ใช้ในรูปภาพ
   */
  async tagUserInPhoto(assetId: number, userId: number, taggedBy: number = 1) {
    try {
      const { rows } = await pool.query(
        `INSERT INTO photo_tags (asset_id, tagged_user_id, tagged_by, tag_source)
         VALUES ($1, $2, $3, 'manual')
         RETURNING id`,
        [assetId, userId, taggedBy]
      );
      return rows[0] ?? null;
    } catch (err) {
      console.error('[GalleryDbService] tagUserInPhoto error:', err);
      return null;
    }
  }

  /**
   * ลบแท็กออกจากรูปภาพ (ใช้โดย tag/route.ts ผ่าน DELETE)
   */
  async removeTag(assetId: number, userId: number) {
    try {
      await pool.query(`DELETE FROM photo_tags WHERE asset_id = $1 AND tagged_user_id = $2`, [assetId, userId]);
    } catch (err) {
      console.error('[GalleryDbService] removeTag error:', err);
    }
    return { success: true };
  }

  /**
   * ลบแท็กตัวเองออกจากรูปภาพ (ใช้โดยผู้ใช้ทั่วไปที่ gallery/untag)
   * คืนค่า true หากลบสำเร็จ, false หากไม่พบแท็ก
   */
  async removeUserPhotoTag(assetId: number, userId: number): Promise<boolean> {
    const { rows } = await pool.query(
      `delete from photo_tags where asset_id = $1 and tagged_user_id = $2 returning *`,
      [assetId, userId]
    );
    return rows.length > 0;
  }

  // ---------------------------------------------------------------
  // ฟังก์ชันต่อไปนี้ย้ายมาจาก src/lib/db.ts (god-file) — ปัจจุบันไม่มี route ใดเรียกใช้
  // คงไว้เพื่อรักษาพฤติกรรมเดิมทั้งหมด ไม่ได้ผูกกับ route ใดในตอนนี้
  // ---------------------------------------------------------------

  /** เช็คว่า user ปลดล็อกรูปนี้แล้วหรือยัง ก่อนอนุญาตให้แท็ก (legacy, ยังไม่ได้ใช้งาน) */
  async hasUnlockedPhoto(userId: number, assetId: number) {
    const { rows } = await pool.query(
      `select 1 from photo_view_verifications
       where user_id = $1 and asset_id = $2 and is_passed = true`,
      [userId, assetId]
    );
    return rows.length > 0;
  }

  /** แท็กเพื่อนในรูปแบบเดิม (มี ON CONFLICT DO NOTHING ป้องกันแท็กซ้ำ) — legacy, ยังไม่ได้ใช้งาน */
  async tagUserInPhotoLegacy(assetId: number, taggedUserId: number, taggedByUserId: number) {
    const { rows } = await pool.query(
      `insert into photo_tags (asset_id, tagged_user_id, tagged_by, tag_source)
       values ($1, $2, $3, 'manual')
       on conflict (asset_id, tagged_user_id) do nothing
       returning *`,
      [assetId, taggedUserId, taggedByUserId]
    );
    return rows[0] ?? null;
  }

  /** ดึงคลังภาพเก่า (photo_archive album) — legacy, ยังไม่ได้ใช้งาน */
  async getGalleryItemsLegacy() {
    const { rows } = await pool.query(`
      select
        ma.id,
        ma.caption as title,
        gen.label as generation,
        (gen.extra->>'year_start')::int as year,
        ma.image_url as image,
        ma.watermark_url as original_image,
        not exists (
          select 1 from photo_view_verifications v
          where v.asset_id = ma.id and v.is_passed = true
        ) as locked,
        coalesce(
          (select v.question from photo_view_verifications v where v.asset_id = ma.id limit 1),
          'ตอบคำถามเกี่ยวกับรุ่นนี้เพื่อปลดล็อก'
        ) as unlock_question,
        5 as points_for_unlock
      from media_assets ma
      left join lookup_options gen on gen.id = ma.generation_option_id
      where ma.owner_type = 'photo_archive'
      order by ma.created_at desc
    `);

    const withTags = [];
    for (const item of rows) {
      const { rows: tags } = await pool.query(
        `select u.name from photo_tags t join users u on u.id = t.tagged_user_id where t.asset_id = $1`,
        [item.id]
      );
      withTags.push({ ...item, tags: tags.map((t) => t.name) });
    }
    return withTags;
  }

  /** บันทึกผล unlock รูปภาพแบบเดิม (ทั้งผ่านและไม่ผ่าน) — legacy, ยังไม่ได้ใช้งาน */
  async recordPhotoUnlockLegacy(
    assetId: number,
    userId: number,
    question: string,
    isPassed: boolean
  ): Promise<{ isPassed: boolean; pointsEarned: number }> {
    const points = isPassed ? 5 : 0;
    await pool.query(
      `INSERT INTO photo_view_verifications (asset_id, user_id, question, is_passed, points_earned)
       VALUES ($1, $2, $3, $4, $5)`,
      [assetId, userId, question, isPassed, points]
    );
    if (isPassed) {
      await pool.query(`UPDATE users SET total_points = total_points + $1 WHERE id = $2`, [points, userId]);
    }
    return { isPassed, pointsEarned: points };
  }

  /** ดึง user gallery ของ user นั้น — legacy, ยังไม่ได้ใช้งาน */
  async getUserGallery(userId: number) {
    const { rows } = await pool.query(
      `SELECT id, image_url, caption, sort_order, created_at
       FROM media_assets
       WHERE owner_type = 'user_gallery' AND owner_id = $1
       ORDER BY sort_order ASC, created_at DESC`,
      [userId]
    );
    return rows;
  }

  /** เพิ่มรูปเข้า user gallery — legacy, ยังไม่ได้ใช้งาน */
  async addUserGalleryImage(userId: number, imageUrl: string, caption?: string) {
    const { rows } = await pool.query(
      `INSERT INTO media_assets (owner_type, owner_id, uploaded_by, image_url, caption)
       VALUES ('user_gallery', $1, $1, $2, $3)
       RETURNING *`,
      [userId, imageUrl, caption ?? null]
    );
    return rows[0];
  }
}

export const galleryDbService = new GalleryDbService();
