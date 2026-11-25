/**
 * เบอร์โทรศัพท์สมาชิก — แอดมินและเจ้าของบัญชีเห็นเท่านั้น ไม่เปิดเผยต่อสมาชิกคนอื่น
 *
 * กติกา: ตัวเลข 10 หลัก ขึ้นต้นด้วย 0 (เบอร์ไทย) เช่น 064-779-8792
 * - หน้าเว็บจัดรูปแบบใส่ขีดให้อัตโนมัติระหว่างพิมพ์ (formatPhoneInput) และพิมพ์ตัวอักษรไม่ได้
 * - ฝั่ง API ตัดขีด/ช่องว่างออก แล้วเก็บเป็นตัวเลขล้วน 10 หลัก เช่น "0647798792"
 * - ตอนแสดงผลใช้ formatPhone ใส่ขีดกลับ
 */

export const PHONE_DIGITS = 10;
/** ความยาวในช่องกรอกรวมขีด 2 ตัว: 064-779-8792 */
export const PHONE_INPUT_MAX_LENGTH = PHONE_DIGITS + 2;

export const PHONE_ERROR = 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0 เช่น 064-779-8792';

export function normalizePhone(input: unknown): { value: string | null; error?: string } {
  if (input === undefined || input === null) return { value: null };
  const raw = String(input).trim();
  if (!raw) return { value: null };

  // อนุญาตแค่ตัวเลข ขีด และช่องว่างคั่น — มีตัวอักษรหรือสัญลักษณ์อื่นถือว่าผิดทันที (ไม่ตัดทิ้งเงียบๆ)
  if (!/^[\d\s-]+$/.test(raw)) return { value: null, error: PHONE_ERROR };

  const digits = raw.replace(/[\s-]/g, '');
  if (!/^0\d{9}$/.test(digits)) return { value: null, error: PHONE_ERROR };
  return { value: digits };
}

/** ใช้ระหว่างพิมพ์: เก็บเฉพาะตัวเลข ไม่เกิน 10 หลัก แล้วใส่ขีดเป็น 064-779-8792 */
export function formatPhoneInput(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, PHONE_DIGITS);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
}

/** แสดงผลเบอร์ที่เก็บใน DB (ตัวเลขล้วน) — เบอร์เก่าที่ไม่ใช่ 10 หลักแสดงตามเดิม */
export function formatPhone(stored: string | null | undefined): string {
  if (!stored) return '';
  return /^\d{10}$/.test(stored) ? formatPhoneInput(stored) : stored;
}
