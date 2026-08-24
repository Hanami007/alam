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
      // ตรวจสอบว่าเคยปลดล็อกหรือยัง
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

      // ให้คะแนนผู้ใช้
      await pool.query(
        `UPDATE users SET total_points = total_points + $1 WHERE id = $2`,
        [points, userId]
      );

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
      await pool.query(
        `UPDATE users SET total_points = total_points + $1 WHERE id = $2`,
        [points, userId]
      );

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
   * ลบแท็กออกจากรูปภาพ
   */
  async removeTag(assetId: number, userId: number) {
    try {
      await pool.query(
        `DELETE FROM photo_tags WHERE asset_id = $1 AND tagged_user_id = $2`,
        [assetId, userId]
      );
    } catch (err) {
      console.error('[GalleryDbService] removeTag error:', err);
    }
    return { success: true };
  }
}

export const galleryDbService = new GalleryDbService();
