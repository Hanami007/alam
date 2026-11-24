/**
 * เบอร์โทรศัพท์สมาชิก — แอดมินและเจ้าของบัญชีเห็นเท่านั้น ไม่เปิดเผยต่อสมาชิกคนอื่น
 *
 * รับได้ทั้ง 081-234-5678, 081 234 5678, +66812345678 แล้วเก็บเป็นตัวเลขล้วน (มี + นำหน้าได้)
 * ความยาวรวมไม่เกิน FIELD_LIMITS.phone (varchar(20) ใน migration 1750000020000_user-phone)
 */
export function normalizePhone(input: unknown): { value: string | null; error?: string } {
  if (input === undefined || input === null) return { value: null };
  const raw = String(input).trim();
  if (!raw) return { value: null };

  const cleaned = raw.replace(/[\s\-().]/g, '');
  if (!/^\+?\d{9,15}$/.test(cleaned)) {
    return { value: null, error: 'เบอร์โทรศัพท์ไม่ถูกต้อง (ตัวเลข 9–15 หลัก)' };
  }
  return { value: cleaned };
}
