/**
 * Synology DSM WebAPI Client สำหรับเชื่อมต่อกับ nas.csmju.com
 */
import sharp from 'sharp';

const NAS_HOST = process.env.NAS_BASE_URL || 'https://nas.csmju.com';
// ไฟล์ต้นฉบับบน NAS เป็นรูปถ่ายจริงความละเอียดสูง (พบว่าบางไฟล์ ~6000x4000px, ~5MB)
// ย่อขนาดก่อนส่งให้เว็บเสมอ (ทั้ง grid และ lightbox) ลดเวลาโหลดได้มาก โดยยังคมชัดพอสำหรับจอทั่วไป
const DISPLAY_MAX_WIDTH = 1200;
const DISPLAY_JPEG_QUALITY = 80;
let cachedSid = process.env.NAS_SYNOLOGY_SID || '';
let sidExpiresAt = 0;
let loginPromise: Promise<string | null> | null = null;

// In-memory cache สำหรับเก็บรูปที่ดาวน์โหลดมาแล้ว เพื่อความเร็วสูงสุด
const imageBufferCache = new Map<string, { buffer: ArrayBuffer; contentType: string }>();

export class SynologyApiService {
  /**
   * เข้าสู่ระบบ Synology DSM WebAPI เพื่อรับ _sid (Single-flight mutex)
   */
  async getSessionId(): Promise<string | null> {
    const now = Date.now();
    if (cachedSid && now < sidExpiresAt) {
      return cachedSid;
    }

    if (loginPromise) {
      return loginPromise;
    }

    const username = process.env.NAS_USERNAME;
    const password = process.env.NAS_PASSWORD;

    if (!username || !password) {
      return null;
    }

    loginPromise = (async () => {
      try {
        const loginUrl = `${NAS_HOST}/webapi/entry.cgi?api=SYNO.API.Auth&version=7&method=login&account=${encodeURIComponent(
          username
        )}&passwd=${encodeURIComponent(password)}&session=FileStation&format=sid`;

        const res = await fetch(loginUrl, { signal: AbortSignal.timeout(15000) });
        const data = await res.json();

        if (data.success && data.data?.sid) {
          cachedSid = data.data.sid;
          sidExpiresAt = Date.now() + 1000 * 60 * 60 * 2; // แคชไว้ 2 ชั่วโมง
          return cachedSid;
        }
      } catch {
        // ไม่ log err.message ตรงๆ เพราะข้อความ error บางกรณี (เช่น URL parse ผิด) จะมี
        // NAS_PASSWORD ฝังอยู่ใน loginUrl ทำให้รหัสผ่านหลุดไปอยู่ใน log แบบ plaintext
        console.warn('[SynologyApiService] Login failed (network or auth error)');
      } finally {
        loginPromise = null;
      }
      return null;
    })();

    return loginPromise;
  }

  /**
   * ดึงไฟล์รูปภาพจริงจาก FileStation: /studio/ธรรมเนียบรุ่น 20 - ปัจจุบัน/...
   * มี In-Memory Caching และ Retry
   */
  async downloadFile(relativePath: string): Promise<{ buffer: ArrayBuffer; contentType: string } | null> {
    const cleanRelPath = relativePath.replace(/^\/+/, '');
    const cacheKey = cleanRelPath;

    // 1. ตรวจสอบ In-Memory Cache ก่อน
    if (imageBufferCache.has(cacheKey)) {
      return imageBufferCache.get(cacheKey)!;
    }

    const sid = await this.getSessionId();
    const fullSynoPath = `/studio/ธรรมเนียบรุ่น 20 - ปัจจุบัน/${cleanRelPath}`;
    
    let downloadUrl = `${NAS_HOST}/webapi/entry.cgi?api=SYNO.FileStation.Download&version=2&method=download&path=${encodeURIComponent(
      fullSynoPath
    )}&mode=open`;

    if (sid) {
      downloadUrl += `&_sid=${sid}`;
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(downloadUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'CSMJU-Alumni-App/1.0',
          },
          signal: AbortSignal.timeout(15000),
        });

        const contentType = res.headers.get('content-type') || '';
        
        if (res.ok && contentType.startsWith('image/')) {
          const originalBuffer = await res.arrayBuffer();
          const result = await this.toDisplaySize(originalBuffer, contentType);
          imageBufferCache.set(cacheKey, result);
          return result;
        }
      } catch {
        // รอสักครู่แล้วลองอีกครั้ง
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    }

    return null;
  }

  /**
   * ย่อขนาดรูปให้เหมาะกับการแสดงบนเว็บ (ไฟล์ต้นฉบับบน NAS มักเป็นรูปความละเอียดสูง
   * ระดับกล้อง DSLR เช่น 6000x4000px ~5MB ต่อไฟล์ ซึ่งใหญ่เกินไปมากสำหรับ grid/lightbox)
   * ถ้า resize พลาดด้วยเหตุใดก็ตาม ส่งต้นฉบับกลับไปแทน ไม่ทำให้รูปหายไปเลย
   */
  private async toDisplaySize(
    originalBuffer: ArrayBuffer,
    contentType: string
  ): Promise<{ buffer: ArrayBuffer; contentType: string }> {
    try {
      const resized = await sharp(Buffer.from(originalBuffer))
        .rotate() // หมุนตาม EXIF orientation ก่อน resize
        .resize({ width: DISPLAY_MAX_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: DISPLAY_JPEG_QUALITY })
        .toBuffer();
      // Buffer ของ Node อาจใช้ shared memory pool ภายใน ทำให้ resized.buffer เป็น
      // SharedArrayBuffer ซึ่ง NextResponse ส่งเป็น body ไม่ได้ถูกต้อง (จะได้ "[object SharedArrayBuffer]"
      // เป็น body แทนรูปจริง) — Uint8Array.from() คัดลอกไปยัง ArrayBuffer ใหม่ที่ไม่ใช่ shared pool เสมอ
      const freshArrayBuffer = Uint8Array.from(resized).buffer;
      return { buffer: freshArrayBuffer, contentType: 'image/jpeg' };
    } catch (err) {
      console.warn('[SynologyApiService] resize failed, serving original:', (err as Error).message);
      return { buffer: originalBuffer, contentType };
    }
  }

  /**
   * สแกนอ่านรายการไฟล์จริงจากโฟลเดอร์บน NAS
   */
  async listFiles(subfolder: string = ''): Promise<{ name: string; path: string; isdir: boolean }[]> {
    const sid = await this.getSessionId();
    if (!sid) return [];

    const folderPath = subfolder
      ? `/studio/ธรรมเนียบรุ่น 20 - ปัจจุบัน/${subfolder.replace(/^\/+/, '')}`
      : `/studio/ธรรมเนียบรุ่น 20 - ปัจจุบัน`;

    const listUrl = `${NAS_HOST}/webapi/entry.cgi?api=SYNO.FileStation.List&version=2&method=list&folder_path=${encodeURIComponent(
      folderPath
    )}&_sid=${sid}`;

    try {
      const res = await fetch(listUrl, { signal: AbortSignal.timeout(15000) });
      const data = await res.json();

      if (data.success && Array.isArray(data.data?.files)) {
        return data.data.files.map((f: any) => ({
          name: f.name,
          path: f.path,
          isdir: !!f.isdir,
        }));
      }
    } catch {}

    return [];
  }
}

export const synologyApi = new SynologyApiService();
