import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { FIELD_LIMITS } from '@/lib/field-limits';

/**
 * เก็บไฟล์รูปที่ผู้ใช้อัปโหลดไว้บนดิสก์ (prod: ./data/uploads บน host mount เข้า /app/data/uploads)
 * แล้วเก็บแค่ path ลง DB — เดิมเก็บ base64 ลง users.avatar_url ตรงๆ ทำให้ทุก query ที่ select
 * avatar_url (ฟีด ทำเนียบรุ่น HoF ฯลฯ) ลากข้อมูลรูปหลายสิบ KB ต่อแถวไปด้วย
 *
 * ใช้ฝั่ง server เท่านั้น (fs + sharp)
 */
export const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(process.cwd(), 'data', 'uploads');

export const AVATAR_URL_PREFIX = '/api/uploads/avatars/';
const AVATAR_DIR = path.join(UPLOAD_ROOT, 'avatars');
// <uuid>.webp = อัปโหลดผ่านเว็บ, <sha256>.<ext> = ย้ายมาจาก base64 เดิมโดย migration 1750000017000
const AVATAR_FILE_RE = /^[a-f0-9-]{36}\.webp$|^[a-f0-9]{64}\.(webp|jpg|png|gif)$/;
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const AVATAR_MAX_SIDE = 512;

const CONTENT_TYPES: Record<string, string> = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
};

export function isAvatarFileName(name: string): boolean {
  return AVATAR_FILE_RE.test(name);
}

/** แปลง data URL เป็นไฟล์ webp ขนาดไม่เกิน 512px แล้วคืน path สำหรับเก็บใน DB */
export async function saveAvatarFromDataUrl(dataUrl: string): Promise<string> {
  const match = /^data:image\/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/=\s]+)$/i.exec(dataUrl);
  if (!match) throw new Error('รูปแบบรูปภาพประจำตัวไม่ถูกต้อง');

  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length === 0) throw new Error('ไฟล์รูปภาพว่างเปล่า');
  if (buffer.length > MAX_UPLOAD_BYTES) throw new Error('รูปภาพประจำตัวต้องมีขนาดไม่เกิน 2MB');

  // sharp decode จริงก่อนเขียน — กันไฟล์ที่ไม่ใช่รูปแต่ปลอม prefix มา และตัด EXIF (พิกัด GPS ฯลฯ) ทิ้ง
  let output: Buffer;
  try {
    output = await sharp(buffer)
      .rotate()
      .resize(AVATAR_MAX_SIDE, AVATAR_MAX_SIDE, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    throw new Error('ไม่สามารถอ่านไฟล์รูปภาพนี้ได้');
  }

  const fileName = `${randomUUID()}.webp`;
  await mkdir(AVATAR_DIR, { recursive: true });
  await writeFile(path.join(AVATAR_DIR, fileName), output);
  return `${AVATAR_URL_PREFIX}${fileName}`;
}

/**
 * รับค่ารูปโปรไฟล์จาก client แล้วคืนค่าที่พร้อมเก็บลง users.avatar_url
 * - data:image/... → บันทึกเป็นไฟล์ คืน path
 * - https://... หรือ path ไฟล์ที่อัปโหลดไว้แล้ว → ใช้ตามเดิม
 * - ค่าว่าง → null
 */
export async function normalizeAvatarInput(input: unknown): Promise<string | null> {
  const value = typeof input === 'string' ? input.trim() : '';
  if (!value) return null;
  if (value.startsWith('data:')) return saveAvatarFromDataUrl(value);

  const isUploaded =
    value.startsWith(AVATAR_URL_PREFIX) && isAvatarFileName(value.slice(AVATAR_URL_PREFIX.length));
  if (!isUploaded && !/^https:\/\//i.test(value)) {
    throw new Error('รูปแบบรูปภาพประจำตัวไม่ถูกต้อง');
  }
  if (value.length > FIELD_LIMITS.avatarPath) {
    throw new Error(`ลิงก์รูปภาพต้องยาวไม่เกิน ${FIELD_LIMITS.avatarPath} ตัวอักษร`);
  }
  return value;
}

/** ลบไฟล์รูปเดิมเมื่อผู้ใช้เปลี่ยนรูป (ข้ามถ้าไม่ใช่ไฟล์ที่ระบบเก็บเอง) */
export async function deleteAvatarFile(avatarUrl: string | null | undefined): Promise<void> {
  if (!avatarUrl?.startsWith(AVATAR_URL_PREFIX)) return;
  const fileName = avatarUrl.slice(AVATAR_URL_PREFIX.length);
  if (!isAvatarFileName(fileName)) return;
  await unlink(path.join(AVATAR_DIR, fileName)).catch(() => {});
}

export async function readAvatarFile(
  fileName: string
): Promise<{ data: Buffer; contentType: string } | null> {
  if (!isAvatarFileName(fileName)) return null;
  try {
    const data = await readFile(path.join(AVATAR_DIR, fileName));
    const ext = fileName.split('.').pop() || 'webp';
    return { data, contentType: CONTENT_TYPES[ext] || 'application/octet-stream' };
  } catch {
    return null;
  }
}

// ─── รูปในโพสต์ (post_images) ─────────────────────────────────────────────────

export const POST_IMAGE_URL_PREFIX = '/api/uploads/posts/';
const POST_IMAGE_DIR = path.join(UPLOAD_ROOT, 'posts');
const POST_IMAGE_FILE_RE = /^[a-f0-9-]{36}\.webp$/;
export const MAX_POST_IMAGES = 4;
// หน้าเว็บย่อรูปเหลือ ≤800KB ก่อนส่ง (post-image-picker.tsx) — เผื่อไว้ 1MB สำหรับคนที่ยิง API ตรง
const MAX_POST_IMAGE_BYTES = 1 * 1024 * 1024;
const POST_IMAGE_MAX_SIDE = 1600;

export function isPostImageFileName(name: string): boolean {
  return POST_IMAGE_FILE_RE.test(name);
}

/** แปลง data URL เป็น webp ด้านยาวไม่เกิน 1600px (ตัด EXIF/GPS ทิ้ง) แล้วคืน path สำหรับเก็บใน post_images */
export async function savePostImageFromDataUrl(dataUrl: string): Promise<string> {
  const match = /^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=\s]+)$/i.exec(dataUrl);
  if (!match) throw new Error('รองรับเฉพาะรูป JPG, PNG หรือ WebP');

  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length === 0) throw new Error('ไฟล์รูปภาพว่างเปล่า');
  if (buffer.length > MAX_POST_IMAGE_BYTES) throw new Error('รูปในโพสต์ต้องมีขนาดไม่เกิน 1MB ต่อรูป (หลังย่อ)');

  let output: Buffer;
  try {
    output = await sharp(buffer)
      .rotate()
      .resize(POST_IMAGE_MAX_SIDE, POST_IMAGE_MAX_SIDE, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new Error('ไม่สามารถอ่านไฟล์รูปภาพนี้ได้');
  }

  const fileName = `${randomUUID()}.webp`;
  await mkdir(POST_IMAGE_DIR, { recursive: true });
  await writeFile(path.join(POST_IMAGE_DIR, fileName), output);
  return `${POST_IMAGE_URL_PREFIX}${fileName}`;
}

/** ลบไฟล์รูปโพสต์ (ข้ามค่าที่ไม่ใช่ไฟล์ที่ระบบเก็บเอง) */
export async function deletePostImageFile(imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl?.startsWith(POST_IMAGE_URL_PREFIX)) return;
  const fileName = imageUrl.slice(POST_IMAGE_URL_PREFIX.length);
  if (!isPostImageFileName(fileName)) return;
  await unlink(path.join(POST_IMAGE_DIR, fileName)).catch(() => {});
}

export async function readPostImageFile(fileName: string): Promise<{ data: Buffer; contentType: string } | null> {
  if (!isPostImageFileName(fileName)) return null;
  try {
    return { data: await readFile(path.join(POST_IMAGE_DIR, fileName)), contentType: 'image/webp' };
  } catch {
    return null;
  }
}
