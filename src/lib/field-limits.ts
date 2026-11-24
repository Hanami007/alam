/**
 * ขนาดสูงสุดของฟิลด์ข้อความ — ต้องตรงกับ varchar(n) ใน
 * migrations/1750000017000_naming-convention-and-field-sizes.js
 *
 * ใช้ทั้ง maxLength ของ input ในหน้าเว็บ และตรวจซ้ำฝั่ง API ถ้าแก้ค่าในนี้ต้องเขียน migration
 * ขยาย/ลดขนาดคอลัมน์ให้ตรงกันด้วย ไม่อย่างนั้น DB จะปฏิเสธข้อความที่หน้าเว็บยอมให้กรอก
 */
export const FIELD_LIMITS = {
  // posts / announcements
  postTitle: 100,
  postContent: 1000,
  postCategory: 50,
  // polls
  pollQuestion: 100,
  pollOption: 60,
  // post_interactions (comment)
  comment: 500,
  // users
  name: 100,
  nickname: 50,
  email: 254,
  studentId: 20,
  company: 150,
  position: 100,
  bio: 500,
  facebookUrl: 255,
  lineId: 50,
  phone: 20,
  avatarPath: 255,
  // content_reports
  reportDetail: 500,
  // banned_keywords
  bannedKeyword: 50,
} as const;

export type FieldLimitKey = keyof typeof FIELD_LIMITS;

/** คืนข้อความ error ภาษาไทยถ้าข้อความยาวเกิน ไม่เกินคืน null */
export function checkLength(value: unknown, key: FieldLimitKey, label: string): string | null {
  if (typeof value !== 'string') return null;
  const max = FIELD_LIMITS[key];
  return value.trim().length > max ? `${label}ต้องไม่เกิน ${max} ตัวอักษร` : null;
}
