import { pool } from '@/lib/db';
import { leaderService } from '@/modules/member/services/leader.service';

/**
 * คลังภาพเก่า (รูปจาก NAS) — การปลดล็อกดูรูปรายรุ่น
 * ระบบแท็กรูปอยู่ที่ nas-tag.service.ts ส่วนฟังก์ชันของคลังภาพแบบเก่า (media_assets: แท็ก/ปลดล็อกทีละรูป/
 * อัปโหลดรูปเอง) ไม่มีหน้าไหนเรียกใช้แล้ว จึงลบออกพร้อม route /api/gallery, /tag, /untag, /unlock
 */
export class GalleryDbService {
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
   * ปลดล็อกทำเนียบรุ่นเมื่อตอบคำถามประจำรุ่นถูกต้อง (+10 แต้ม)
   * คำถาม/คำตอบตั้งโดยหัวหน้ารุ่น (generation_unlock_questions) — รุ่นที่ยังไม่มีคำถามปลดล็อกได้เลย
   */
  async unlockGeneration(
    userId: number,
    generation: string,
    answer: string
  ): Promise<{ success: boolean; pointsEarned: number; alreadyUnlocked: boolean; error?: string }> {
    try {
      const { rows: existing } = await pool.query(
        `SELECT id FROM point_transactions WHERE user_id = $1 AND reason = 'unlock_generation' AND reference_id = $2`,
        [userId, generation]
      );
      if (existing.length > 0) {
        return { success: true, pointsEarned: 0, alreadyUnlocked: true };
      }

      if (!(await leaderService.checkUnlockAnswer(generation, answer))) {
        return { success: false, pointsEarned: 0, alreadyUnlocked: false, error: 'คำตอบไม่ถูกต้อง ลองใหม่อีกครั้ง' };
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
      // เดิมตอบ success: true แม้บันทึกไม่สำเร็จ (ผู้ใช้เห็นว่าปลดล็อกแล้วแต่ไม่ได้แต้มจริง)
      console.error('[GalleryDbService] unlockGeneration error:', err);
      return { success: false, pointsEarned: 0, alreadyUnlocked: false, error: 'ปลดล็อกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' };
    }
  }
}

export const galleryDbService = new GalleryDbService();
