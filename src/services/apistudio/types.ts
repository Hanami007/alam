/**
 * TypeScript definitions for apistudio (Photo Studio / Club Media Archive API)
 * Represents photography archives, high-resolution original images, event metadata, and albums.
 */

export interface StudioAlbum {
  id: string;               // เช่น "album-2015-grad"
  title: string;            // พิธีพระราชทานปริญญาบัตร ประจำปี 2558
  description?: string;
  generation?: string;      // รุ่น 43
  year: number;             // 2015 (2558)
  coverImageUrl: string;
  totalPhotos: number;
  createdAt: string;
}

export interface StudioPhotoMetadata {
  camera?: string;          // Canon EOS 5D Mark III
  lens?: string;            // EF 24-70mm f/2.8L II USM
  focalLength?: string;     // 50mm
  iso?: number;             // 400
  aperture?: string;        // f/2.8
  shutterSpeed?: string;    // 1/200s
  capturedAt?: string;      // 2015-02-14T09:30:00Z
  location?: string;        // อาคารแผ่พืช มหาวิทยาลัยแม่โจ้
}

export interface StudioPhoto {
  id: string;               // photo-1
  albumId: string;          // album-2015-grad
  albumTitle: string;
  generation: string;       // รุ่น 43
  year: number;             // 2015
  title: string;
  description?: string;
  watermarkedUrl: string;   // รูปภาพตัวอย่างแบบติดลายน้ำ/เบลอ
  originalUrl: string;      // รูปภาพความละเอียดสูงต้นฉบับ
  metadata?: StudioPhotoMetadata;
  tags?: string[];          // รายชื่อบุคคล/แท็กจากสตูดิโอ
  createdAt: string;
}

export interface StudioPhotoSearchParams {
  albumId?: string;
  generation?: string;
  year?: number;
  query?: string;
  limit?: number;
  offset?: number;
}
