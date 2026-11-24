import { pool } from '@/lib/db';
import { isSafeNasRelativePath } from '@/services/nas/synology-api.service';
import { notificationDbService } from '@/modules/notifications/services/notification.service';

/**
 * แท็กคนในรูปคลังภาพเก่าจาก NAS (nas_photo_tags — ดู migration 1750000024000)
 *
 * กติกา:
 * - แท็กได้เฉพาะคนที่ปลดล็อกคลังภาพรุ่นนั้นแล้ว (point_transactions 'unlock_generation') หรือแอดมิน
 * - แท็กตัวเอง = ยอมรับทันที, แท็กเพื่อน = รอเจ้าตัวกดยอมรับ (ปฏิเสธ = ลบ)
 * - ลบแท็กได้: คนที่ถูกแท็ก, คนแท็ก (ตอนยังรอยอมรับ), แอดมิน
 */

export interface PhotoTag {
  id: number;
  userId: number;
  name: string;
  status: 'pending' | 'accepted';
  taggedByName: string | null;
  canRemove: boolean;
}

export interface AlbumPhoto {
  tagId: number;
  path: string;
  imageUrl: string;
  generation: string | null;
  folder: string;
  taggedByName: string | null;
  createdAt: string;
}

export function nasImageUrl(path: string) {
  return `/api/nas/image?path=${encodeURIComponent(path)}&v=syno`;
}

/** "รุ่น 28/กิจกรรม/IMG_1.JPG" → { generation: "รุ่น 28", folder: "กิจกรรม" } (null = path ไม่ถูกรูปแบบ) */
export function parsePhotoPath(path: string): { generation: string; folder: string } | null {
  if (typeof path !== 'string' || path.length > 500 || !isSafeNasRelativePath(path)) return null;
  const m = /^(รุ่น \d+)\/(?:(.+)\/)?[^/]+$/.exec(path);
  return m ? { generation: m[1], folder: m[2] ?? '' } : null;
}

export class NasTagError extends Error {}

export class NasTagService {
  async canTag(userId: number, role: string, generationLabel: string): Promise<boolean> {
    if (role === 'admin') return true;
    const { rows } = await pool.query(
      `SELECT 1 FROM point_transactions WHERE user_id = $1 AND reason = 'unlock_generation' AND reference_id = $2 LIMIT 1`,
      [userId, generationLabel]
    );
    return rows.length > 0;
  }

  async listForPhoto(path: string, viewer: { id: number; role: string }): Promise<PhotoTag[]> {
    const { rows } = await pool.query(
      `SELECT t.id, t.tagged_user_id, u.name, t.status, t.tagged_by, tb.name AS tagged_by_name
       FROM nas_photo_tags t
       JOIN users u ON u.id = t.tagged_user_id
       LEFT JOIN users tb ON tb.id = t.tagged_by
       WHERE t.photo_path = $1
       ORDER BY t.created_at`,
      [path]
    );
    // แท็กที่ยังรอยอมรับ เห็นเฉพาะคนที่ถูกแท็ก คนแท็ก และแอดมิน
    return rows
      .filter((r) => r.status === 'accepted' || viewer.role === 'admin' || r.tagged_user_id === viewer.id || r.tagged_by === viewer.id)
      .map((r) => ({
        id: r.id,
        userId: r.tagged_user_id,
        name: r.name,
        status: r.status,
        taggedByName: r.tagged_by_name,
        canRemove:
          viewer.role === 'admin' ||
          r.tagged_user_id === viewer.id ||
          (r.status === 'pending' && r.tagged_by === viewer.id),
      }));
  }

  async addTag(path: string, taggedUserId: number, tagger: { id: number; role: string; name: string }) {
    const parsed = parsePhotoPath(path);
    if (!parsed) throw new NasTagError('รูปภาพไม่ถูกต้อง');
    if (!(await this.canTag(tagger.id, tagger.role, parsed.generation))) {
      throw new NasTagError(`ต้องปลดล็อกคลังภาพ${parsed.generation}ก่อนจึงจะแท็กได้`);
    }

    const { rows: target } = await pool.query(`SELECT id, name, status FROM users WHERE id = $1`, [taggedUserId]);
    if (!target[0] || target[0].status !== 'approved') throw new NasTagError('ไม่พบสมาชิกที่ต้องการแท็ก');

    const isSelf = taggedUserId === tagger.id;
    const { rows: gen } = await pool.query(
      `SELECT id FROM lookup_options WHERE category = 'generation' AND label = $1`,
      [parsed.generation]
    );
    const { rows } = await pool.query(
      `INSERT INTO nas_photo_tags (photo_path, generation_option_id, tagged_user_id, tagged_by, status, responded_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (photo_path, tagged_user_id) DO NOTHING
       RETURNING id`,
      [path, gen[0]?.id ?? null, taggedUserId, tagger.id, isSelf ? 'accepted' : 'pending', isSelf ? new Date() : null]
    );
    if (rows.length === 0) throw new NasTagError(`${target[0].name} ถูกแท็กในรูปนี้แล้ว`);

    if (!isSelf) {
      await notificationDbService
        .createNotification(
          taggedUserId,
          'system',
          'มีคนแท็กคุณในรูปคลังภาพเก่า',
          `${tagger.name} แท็กคุณในรูปของ${parsed.generation} — ยอมรับหรือปฏิเสธได้ที่ โปรไฟล์ → อัลบั้มของฉัน`,
          '/profile',
          String(rows[0].id)
        )
        .catch(() => {});
    }
    return { id: rows[0].id, status: isSelf ? 'accepted' : 'pending' };
  }

  /** คนที่ถูกแท็กตอบรับ (accept) หรือปฏิเสธ (decline = ลบแท็ก) */
  async respond(tagId: number, userId: number, accept: boolean): Promise<boolean> {
    const { rowCount } = accept
      ? await pool.query(
          `UPDATE nas_photo_tags SET status = 'accepted', responded_at = now()
           WHERE id = $1 AND tagged_user_id = $2 AND status = 'pending'`,
          [tagId, userId]
        )
      : await pool.query(`DELETE FROM nas_photo_tags WHERE id = $1 AND tagged_user_id = $2 AND status = 'pending'`, [tagId, userId]);
    return Boolean(rowCount);
  }

  async remove(tagId: number, viewer: { id: number; role: string }): Promise<boolean> {
    const { rowCount } = await pool.query(
      `DELETE FROM nas_photo_tags
       WHERE id = $1 AND ($3 OR tagged_user_id = $2 OR (status = 'pending' AND tagged_by = $2))`,
      [tagId, viewer.id, viewer.role === 'admin']
    );
    return Boolean(rowCount);
  }

  async getAlbum(userId: number): Promise<{ tagged: AlbumPhoto[]; pending: AlbumPhoto[] }> {
    const { rows } = await pool.query(
      `SELECT t.id, t.photo_path, t.status, t.created_at, tb.name AS tagged_by_name
       FROM nas_photo_tags t LEFT JOIN users tb ON tb.id = t.tagged_by
       WHERE t.tagged_user_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    );
    const toPhoto = (r: any): AlbumPhoto => {
      const parsed = parsePhotoPath(r.photo_path);
      return {
        tagId: r.id,
        path: r.photo_path,
        imageUrl: nasImageUrl(r.photo_path),
        generation: parsed?.generation ?? null,
        folder: parsed?.folder ?? '',
        taggedByName: r.tagged_by_name,
        createdAt: r.created_at,
      };
    };
    return {
      tagged: rows.filter((r) => r.status === 'accepted').map(toPhoto),
      pending: rows.filter((r) => r.status === 'pending').map(toPhoto),
    };
  }

  /** ค้นหาสมาชิกที่อนุมัติแล้วเพื่อแท็ก (ไม่รวมแอดมิน) */
  async searchMembers(query: string) {
    const q = query.trim();
    if (q.length < 1) return [];
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.nickname, g.label AS generation
       FROM users u LEFT JOIN lookup_options g ON g.id = u.generation_option_id
       WHERE u.status = 'approved' AND u.role <> 'admin'
         AND (u.name ILIKE $1 OR u.nickname ILIKE $1 OR ($2 <> '' AND u.student_id LIKE $2 || '%'))
       ORDER BY u.name LIMIT 8`,
      // ค้นด้วยรหัสนักศึกษาเฉพาะเมื่อพิมพ์ตัวเลข (Postgres ไม่รับอักขระ \0 จึงใช้เงื่อนไขแทน)
      [`%${q}%`, q.replace(/\D/g, '')]
    );
    return rows.map((r) => ({ id: r.id, name: r.name, nickname: r.nickname, generation: r.generation }));
  }
}

export const nasTagService = new NasTagService();
