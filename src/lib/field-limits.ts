/**
 * ขนาดสูงสุดของฟิลด์ข้อความ — ต้องตรงกับ varchar(n) ใน
 * migrations/1750000017000_naming-convention-and-field-sizes.js
 *
 * ใช้ทั้ง maxLength ของ input ในหน้าเว็บ และตรวจซ้ำฝั่ง API ถ้าแก้ค่าในนี้ต้องเขียน migration
 * ขยาย/ลดขนาดคอลัมน์ให้ตรงกันด้วย ไม่อย่างนั้น DB จะปฏิเสธข้อความที่หน้าเว็บยอมให้กรอก
 */
export const FIELD_LIMITS = {
  // posts / announcements — ประกาศของแอดมินใช้ postTitle/postContent (ยาวได้มากกว่า)
  postTitle: 100,
  postContent: 1000,
  // โพสต์ที่สมาชิกสร้างเองจากหน้าวอลล์ — สั้นกว่าประกาศโดยตั้งใจ (คอลัมน์ DB ยังเป็นเพดานของ postTitle/postContent)
  memberPostTitle: 50,
  memberPostContent: 250,
  postCategory: 50,
  // polls
  pollQuestion: 100,
  pollOption: 60,
  // post_interactions (comment)
  comment: 50,
  // users
  name: 50,
  nickname: 50,
  email: 254,
  studentId: 20,
  company: 150,
  position: 100,
  // 4 ช่องนี้ตั้งเข้มกว่าขนาดคอลัมน์ใน DB โดยตั้งใจ (bio varchar(500), facebook_url varchar(255),
  // line_id varchar(50), phone varchar(20)) — ไม่ลดขนาดคอลัมน์เพราะจะตัดข้อมูลเดิมของสมาชิกทิ้ง
  // แอปบังคับค่าด้านล่างทั้งหน้าเว็บและ API แล้ว ส่วนคอลัมน์ DB เป็นเพดานสำรองอีกชั้น
  bio: 150,
  facebookUrl: 100,
  lineId: 20,
  phone: 10, // ตัวเลขล้วน 10 หลัก (ช่องกรอกยาว 12 รวมขีด — ดู src/lib/phone.ts)
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
