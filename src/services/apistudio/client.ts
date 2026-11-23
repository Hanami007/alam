import { StudioAlbum, StudioPhoto, StudioPhotoSearchParams } from './types';

/**
 * ไม่มีข้อมูลจำลองแล้ว — ถ้าไม่ได้ตั้ง APISTUDIO_BASE_URL จะคืนค่าว่าง
 * (รูปจริงของระบบมาจาก media_assets ใน DB และ NAS)
 */
const MOCK_ALBUMS: StudioAlbum[] = [];
const MOCK_PHOTOS: StudioPhoto[] = [];

export class ApistudioClient {
  private baseUrl: string | null;
  private apiKey: string | null;

  constructor() {
    this.baseUrl = process.env.APISTUDIO_BASE_URL || null;
    this.apiKey = process.env.APISTUDIO_API_KEY || null;
  }

  /**
   * ดึงรายการอัลบั้มรูปภาพทั้งหมดจากสตูดิโอ
   */
  async getAlbums(): Promise<StudioAlbum[]> {
    if (this.baseUrl) {
      try {
        const res = await fetch(`${this.baseUrl}/api/v1/albums`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey || ''}`,
            'Content-Type': 'application/json',
          },
          next: { revalidate: 3600 },
        });
        if (res.ok) return (await res.json()) as StudioAlbum[];
      } catch (err) {
        console.error('[apistudio] Error calling getAlbums:', err);
      }
    }
    return [...MOCK_ALBUMS];
  }

  /**
   * ดึงภาพถ่ายทั้งหมด หรือค้นหาตามเงื่อนไข
   */
  async getPhotos(params: StudioPhotoSearchParams = {}): Promise<StudioPhoto[]> {
    if (this.baseUrl) {
      try {
        const queryParams = new URLSearchParams();
        if (params.albumId) queryParams.set('albumId', params.albumId);
        if (params.generation) queryParams.set('generation', params.generation);
        if (params.year) queryParams.set('year', String(params.year));
        if (params.query) queryParams.set('q', params.query);
        if (params.limit) queryParams.set('limit', String(params.limit));

        const res = await fetch(`${this.baseUrl}/api/v1/photos?${queryParams.toString()}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey || ''}`,
            'Content-Type': 'application/json',
          },
          next: { revalidate: 300 },
        });
        if (res.ok) return (await res.json()) as StudioPhoto[];
      } catch (err) {
        console.error('[apistudio] Error calling getPhotos:', err);
      }
    }

    return MOCK_PHOTOS.filter((photo) => {
      if (params.albumId && photo.albumId !== params.albumId) return false;
      if (params.generation && !photo.generation.includes(params.generation)) return false;
      if (params.year && photo.year !== params.year) return false;
      if (params.query) {
        const q = params.query.toLowerCase();
        const matchesTitle = photo.title.toLowerCase().includes(q);
        const matchesDesc = photo.description?.toLowerCase().includes(q) ?? false;
        const matchesTags = photo.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }
      return true;
    });
  }

  /**
   * ดึงข้อมูลภาพถ่ายรายใบตาม Photo ID
   */
  async getPhotoById(photoId: string): Promise<StudioPhoto | null> {
    if (this.baseUrl) {
      try {
        const res = await fetch(`${this.baseUrl}/api/v1/photos/${encodeURIComponent(photoId)}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey || ''}`,
            'Content-Type': 'application/json',
          },
          next: { revalidate: 3600 },
        });
        if (res.ok) return (await res.json()) as StudioPhoto;
      } catch (err) {
        console.error('[apistudio] Error calling getPhotoById:', err);
      }
    }

    const found = MOCK_PHOTOS.find((p) => p.id === photoId);
    return found ? { ...found } : null;
  }
}

export const apistudio = new ApistudioClient();
