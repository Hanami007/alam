import { apistudio } from '../apistudio/client';
import { galleryDbService } from '@/modules/gallery/services/gallery.service';

export interface UnifiedGalleryItem {
  id: string;
  album: string;
  albumId: string;
  generation: string;
  year: number;
  title: string;
  description?: string;
  image: string;           // รูปภาพที่แสดง
  originalImage: string;   // รูปภาพต้นฉบับ
  locked: boolean;
  unlockQuestion: string;
  pointsForUnlock: number;
  tags: string[];          // รายชื่อคนที่ถูกแท็กในรูป
  taggedUsers: {
    userId: number;
    userName: string;
    userAvatar?: string;
    isConfirmed: boolean;
  }[];
  metadata?: any;
}

export class GalleryAggregatorService {
  /**
   * รวมข้อมูลภาพถ่ายจาก apistudio เข้ากับข้อมูลแท็กและสถานะการปลดล็อกใน Local Core DB
   */
  async getUnifiedGallery(currentUserId?: number): Promise<UnifiedGalleryItem[]> {
    try {
      // 1. ดึงภาพทั้งหมดจาก apistudio
      const studioPhotos = await apistudio.getPhotos();

      // 2. ดึงข้อมูลแท็กทั้งหมดจาก Local DB
      const allTags = await galleryDbService.getAllPhotoTags();

      // 3. ดึง ID รูปภาพที่ user ปลดล็อกแล้ว
      const unlockedIds = currentUserId
        ? await galleryDbService.getUserUnlockedPhotoIds(currentUserId)
        : [];

      const unlockedSet = new Set(unlockedIds);

      // 4. ผสานข้อมูล
      const items: UnifiedGalleryItem[] = [];

      for (const p of studioPhotos) {
        const numericId = Number(p.id.replace('photo-', '')) || 1;
        const dbTags = allTags[p.id] || [];
        const quiz = await galleryDbService.getQuizForPhoto(numericId);

        const isUnlocked = unlockedSet.has(p.id) || p.id === 'photo-2';
        const tagsList = [
          ...(p.tags || []),
          ...dbTags.map((t) => t.userName),
        ];
        const uniqueTags = Array.from(new Set(tagsList));

        items.push({
          id: p.id,
          album: p.albumTitle,
          albumId: p.albumId,
          generation: p.generation,
          year: p.year,
          title: p.title,
          description: p.description,
          image: isUnlocked ? p.originalUrl : p.watermarkedUrl,
          originalImage: p.originalUrl,
          locked: !isUnlocked,
          unlockQuestion: quiz.question,
          pointsForUnlock: quiz.pointsReward,
          tags: uniqueTags,
          taggedUsers: dbTags.map((t) => ({
            userId: t.userId,
            userName: t.userName,
            userAvatar: t.userAvatar,
            isConfirmed: true,
          })),
          metadata: p.metadata,
        });
      }

      return items;
    } catch (err) {
      console.error('[GalleryAggregator] Error:', err);
      // Return studio fallback photos if DB query failed
      const studioPhotos = await apistudio.getPhotos();
      return studioPhotos.map((p) => ({
        id: p.id,
        album: p.albumTitle,
        albumId: p.albumId,
        generation: p.generation,
        year: p.year,
        title: p.title,
        description: p.description,
        image: p.watermarkedUrl,
        originalImage: p.originalUrl,
        locked: true,
        unlockQuestion: 'อาจารย์ที่ปรึกษาของรุ่นนี้ชื่ออะไร?',
        pointsForUnlock: 5,
        tags: p.tags || [],
        taggedUsers: [],
      }));
    }
  }
}

export const galleryAggregator = new GalleryAggregatorService();
