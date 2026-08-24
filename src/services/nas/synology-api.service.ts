/**
 * Synology DSM WebAPI Client สำหรับเชื่อมต่อกับ nas.csmju.com
 */

const NAS_HOST = process.env.NAS_BASE_URL || 'https://nas.csmju.com';
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
      } catch (err: any) {
        console.warn('[SynologyApiService] Login failed:', err.message);
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
          const buffer = await res.arrayBuffer();
          const result = { buffer, contentType };
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
