import { StudioAlbum, StudioPhoto, StudioPhotoSearchParams } from './types';

const MOCK_ALBUMS: StudioAlbum[] = [
  {
    id: 'album-gen-43',
    title: 'อัลบั้มรุ่น 43 (CSMJU #28)',
    description: 'ประมวลภาพกิจกรรมและวันรับปริญญาบัตร รุ่น 43',
    generation: 'รุ่น 43',
    year: 2015,
    coverImageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=700&q=80',
    totalPhotos: 45,
    createdAt: '2015-03-01T00:00:00Z',
  },
  {
    id: 'album-gen-46',
    title: 'อัลบั้มรุ่น 46 (CSMJU #31)',
    description: 'ภาพกิจกรรมค่ายไอที และทริปสัมมนารุ่น 46',
    generation: 'รุ่น 46',
    year: 2018,
    coverImageUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=700&q=80',
    totalPhotos: 62,
    createdAt: '2018-05-15T00:00:00Z',
  },
  {
    id: 'album-sports-2019',
    title: 'การแข่งขันกีฬาสานสัมพันธ์ศิษย์เก่า 2019',
    description: 'ภาพบรรยากาศการแข่งขันฟุตบอลกระชับมิตรศิษย์เก่า',
    generation: 'รวมทุกรุ่น',
    year: 2019,
    coverImageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=700&q=80',
    totalPhotos: 38,
    createdAt: '2019-11-20T00:00:00Z',
  }
];

const MOCK_PHOTOS: StudioPhoto[] = [
  {
    id: 'photo-1',
    albumId: 'album-gen-43',
    albumTitle: 'อัลบั้มรุ่น 43',
    generation: 'รุ่น 43',
    year: 2015,
    title: 'พิธีรับปริญญา รุ่น 43',
    description: 'ภาพถ่ายรวมหน้าอาคารวิทยาการคอมพิวเตอร์หลังเสร็จสิ้นพิธีพระราชทานปริญญาบัตร',
    watermarkedUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=700&q=60&blur=60',
    originalUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=85',
    metadata: {
      camera: 'Canon EOS 5D Mark III',
      lens: 'EF 24-70mm f/2.8L II USM',
      location: 'ลานหน้าตึกวิทยาการคอมพิวเตอร์ แม่โจ้',
      capturedAt: '2015-02-14T11:00:00Z',
    },
    tags: ['สมชาย ใจดี', 'สมศักดิ์ มั่นคง'],
    createdAt: '2015-02-15T00:00:00Z',
  },
  {
    id: 'photo-2',
    albumId: 'album-gen-46',
    albumTitle: 'อัลบั้มรุ่น 46',
    generation: 'รุ่น 46',
    year: 2018,
    title: 'ทริปเพื่อนกลุ่ม IT สัมมนาแม่แจ่ม',
    description: 'บรรยากาศกิจกรรมกลุ่มวิชาสัมมนาทางวิทยาการคอมพิวเตอร์',
    watermarkedUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=700&q=60&blur=60',
    originalUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1200&q=85',
    metadata: {
      camera: 'Sony A7 III',
      lens: 'FE 24-105mm F4 G OSS',
      location: 'อำเภอแม่แจ่ม เชียงใหม่',
      capturedAt: '2018-04-10T15:30:00Z',
    },
    tags: ['สมหญิง รักเรียน'],
    createdAt: '2018-04-12T00:00:00Z',
  },
  {
    id: 'photo-3',
    albumId: 'album-sports-2019',
    albumTitle: 'กีฬาสานสัมพันธ์ 2019',
    generation: 'รุ่น 44',
    year: 2019,
    title: 'พิธีเปิดการแข่งขันฟุตบอลกระชับมิตร',
    description: 'ตัวแทนศิษย์เก่าแต่ละรุ่นร่วมลงสนามในงานแข่งขันกีฬา',
    watermarkedUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=700&q=60&blur=60',
    originalUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=85',
    metadata: {
      camera: 'Nikon D850',
      lens: 'AF-S NIKKOR 70-200mm f/2.8E FL ED VR',
      location: 'สนามฟุตบอล มหาวิทยาลัยแม่โจ้',
      capturedAt: '2019-11-20T14:00:00Z',
    },
    tags: ['อนันต์ รุ่งเรืองกิจ'],
    createdAt: '2019-11-21T00:00:00Z',
  }
];

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
