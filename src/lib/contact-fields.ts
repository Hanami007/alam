import { FIELD_LIMITS } from './field-limits';

/**
 * ตรวจ/ทำความสะอาดช่องทางติดต่อ (Facebook, LINE ID) — ใช้ทั้งหน้าสมัคร, แก้โปรไฟล์ และฝั่ง API
 * คืน { value } (null = ไม่ได้กรอก) หรือ { error } เป็นข้อความภาษาไทย
 */
type Result = { value: string | null; error?: string };

const FACEBOOK_ERROR = `Facebook ต้องเป็นลิงก์ facebook.com หรือชื่อผู้ใช้ (ไม่เกิน ${FIELD_LIMITS.facebookUrl} ตัวอักษร)`;
const LINE_ERROR = `LINE ID ใช้ได้เฉพาะ a-z, 0-9, จุด, ขีด, ขีดล่าง ยาว 4–${FIELD_LIMITS.lineId} ตัว (บัญชีทางการขึ้นต้นด้วย @ ได้)`;

/**
 * รับได้ 2 แบบ:
 *  - ลิงก์: facebook.com/..., www./m./web.facebook.com/..., fb.com/... (มี https:// หรือไม่ก็ได้)
 *  - ชื่อผู้ใช้: a-z 0-9 และจุด 5–50 ตัว (ตามกติกาชื่อผู้ใช้ของ Facebook)
 */
export function normalizeFacebook(input: unknown): Result {
  if (input === undefined || input === null) return { value: null };
  const raw = String(input).trim();
  if (!raw) return { value: null };
  if (raw.length > FIELD_LIMITS.facebookUrl || /\s/.test(raw)) return { value: null, error: FACEBOOK_ERROR };

  if (/^[a-z0-9.]{5,50}$/i.test(raw)) return { value: raw };

  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    const hostOk = /^((www|m|web|mbasic)\.)?(facebook\.com|fb\.com)$/i.test(url.hostname);
    if (hostOk && url.pathname.length > 1) {
      const normalized = `https://${url.hostname.toLowerCase()}${url.pathname}${url.search}`;
      if (normalized.length <= FIELD_LIMITS.facebookUrl) return { value: normalized };
    }
  } catch {
    // ตกลงไปคืน error ข้างล่าง
  }
  return { value: null, error: FACEBOOK_ERROR };
}

export function normalizeLineId(input: unknown): Result {
  if (input === undefined || input === null) return { value: null };
  const raw = String(input).trim().toLowerCase();
  if (!raw) return { value: null };
  const re = new RegExp(`^@?[a-z0-9._-]{4,${FIELD_LIMITS.lineId}}$`);
  if (!re.test(raw)) return { value: null, error: LINE_ERROR };
  return { value: raw };
}
