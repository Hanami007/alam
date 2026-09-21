import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { pool } from './db';

export interface UserSession {
  id: number;
  student_id: string | null;
  email: string;
  name: string;
  role: 'alumni' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  student_status: 'studying' | 'alumni';
  total_points: number;
  avatar_url?: string | null;
  company?: string | null;
  position?: string | null;
  bio?: string | null;
  generation?: string | null;
  province?: string | null;
  career_type?: string | null;
  generation_option_id?: number | null;
  show_hometown_on_map: boolean;
  show_workplace_on_map: boolean;
  is_available_for_mentorship?: boolean;
}

/** เข้ารหัสรหัสผ่าน */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/** ตรวจสอบรหัสผ่าน */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

/** ตรวจสอบข้อมูลล็อกอิน (รับ student_id หรือ email) */
export async function authenticateUser(identifier: string, password: string): Promise<UserSession | null> {
  const trimmed = identifier.trim();
  const { rows } = await pool.query(
    `SELECT u.*, gen.label as generation, prov.label as province, ct.label as career_type
     FROM users u
     LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
     LEFT JOIN lookup_options prov ON prov.id = u.province_option_id
     LEFT JOIN lookup_options ct ON ct.id = u.career_option_id
     WHERE u.student_id = $1 OR u.email = $1
     LIMIT 1`,
    [trimmed]
  );

  if (rows.length === 0) return null;
  const user = rows[0];

  if (!user.password_hash) {
    // ถ้ายังไม่มี password_hash ให้ลองเทียบ default '123456'
    if (password === '123456') {
      const newHash = await hashPassword('123456');
      await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [newHash, user.id]);
      return user as UserSession;
    }
    return null;
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) return null;

  return user as UserSession;
}

/** สร้าง Session และเก็บลง DB */
export async function createSession(userId: number): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 วัน

  await pool.query(
    `INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)`,
    [sessionId, userId, expiresAt]
  );

  return sessionId;
}

/** ดึงข้อมูลผู้ใช้จาก Session ID */
export async function getSessionUser(sessionId: string): Promise<UserSession | null> {
  if (!sessionId) return null;

  const { rows } = await pool.query(
    `SELECT u.id, u.student_id, u.email, u.name, u.role, u.status, u.student_status,
            u.total_points, u.avatar_url, u.company, u.position, u.bio, u.is_available_for_mentorship,
            u.show_hometown_on_map, u.show_workplace_on_map,
            gen.label as generation, prov.label as province, ct.label as career_type
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
     LEFT JOIN lookup_options prov ON prov.id = u.province_option_id
     LEFT JOIN lookup_options ct ON ct.id = u.career_option_id
     WHERE s.id = $1 AND s.expires_at > now()`,
    [sessionId]
  );

  return (rows[0] as UserSession) ?? null;
}

/** ลบ Session (Logout) */
export async function deleteSession(sessionId: string): Promise<void> {
  if (!sessionId) return;
  await pool.query(`DELETE FROM sessions WHERE id = $1`, [sessionId]);
}

/**
 * ดึง Current User ปัจจุบันจาก Session Cookie เท่านั้น
 *
 * เดิมฟังก์ชันนี้มี fallback ที่ดึงบัญชีศิษย์เก่าคนแรกจาก DB มาให้ใช้แทนเมื่อ session
 * ไม่ถูกต้อง/ไม่พบ (เพื่อให้ "ใช้งานได้ทันที") แต่นั่นคือช่องโหว่ auth bypass ร้ายแรง:
 * แค่ตั้ง cookie session_id เป็นค่าอะไรก็ได้ (ที่ middleware เช็คแค่ว่ามี cookie อยู่
 * ไม่ได้ตรวจว่า valid) ก็จะได้สิทธิ์เป็นบัญชีจริงของคนอื่นทันทีโดยไม่ต้องใส่รหัสผ่าน
 * ห้ามใส่ fallback แบบนี้กลับเข้ามาอีก — ถ้าไม่มี session ที่ถูกต้องจริง ต้อง return null เสมอ
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;
    if (!sessionId) return null;
    return await getSessionUser(sessionId);
  } catch {
    return null;
  }
}
