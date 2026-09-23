import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { pool } from './db';

/** อายุ session ทั้ง cookie ฝั่ง browser และแถวใน DB ต้องตรงกันเสมอ (30 วัน) */
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5;
const LOGIN_RATE_LIMIT_WINDOW_TEXT = '15 minutes';

// hash เปล่าไว้เทียบเวลาไม่มี user จริงตรงกับ identifier ที่กรอก (ป้องกัน timing attack
// ที่เดาได้ว่ามีบัญชีนี้อยู่จริงไหมจากความเร็วตอบกลับ — ถ้าไม่เจอ user เลยจะ return ทันที
// ไม่ผ่าน bcrypt.compare ซึ่งกินเวลาราว 70ms ต่างจากกรณีเจอ user แต่รหัสผ่านผิดอย่างชัดเจน)
// คำนวณครั้งเดียวตอน module โหลด ไม่ใช่ทุก request
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('timing-attack-mitigation-dummy', 10);

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
  birth_date?: string | null;
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

/**
 * ตรวจสอบข้อมูลล็อกอิน (รับ student_id หรือ email)
 *
 * - อีเมลเทียบแบบไม่สนตัวพิมพ์ใหญ่/เล็ก (LOWER ทั้งสองฝั่ง) เพราะตอนสมัครสมาชิกเก็บอีเมล
 *   เป็นตัวพิมพ์เล็กเสมอ (ดู src/app/api/auth/register/route.ts) แต่เดิมจุดนี้เทียบตรงๆ
 *   ทำให้คนพิมพ์อีเมลตัวใหญ่ปนหรือ Caps Lock ติด ล็อกอินไม่ได้ทั้งที่รหัสผ่านถูก
 * - ทุก path ที่ authentication ล้มเหลว (ไม่เจอ user / ไม่มี password_hash / รหัสผ่านผิด)
 *   ต้องผ่าน bcrypt.compare เสมอ (จริงหรือ dummy hash) เพื่อให้เวลาตอบกลับใกล้เคียงกัน
 *   ป้องกัน timing attack ที่เดาได้ว่ามี identifier นี้อยู่จริงในระบบไหมจากความเร็วตอบกลับ
 */
export async function authenticateUser(identifier: string, password: string): Promise<UserSession | null> {
  const trimmed = identifier.trim();
  const { rows } = await pool.query(
    `SELECT u.*, gen.label as generation, prov.label as province, ct.label as career_type
     FROM users u
     LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
     LEFT JOIN lookup_options prov ON prov.id = u.province_option_id
     LEFT JOIN lookup_options ct ON ct.id = u.career_option_id
     WHERE u.student_id = $1 OR LOWER(u.email) = LOWER($1)
     LIMIT 1`,
    [trimmed]
  );

  if (rows.length === 0) {
    await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
    return null;
  }
  const user = rows[0];

  // บัญชีที่ยังไม่มี password_hash (เช่น รายการที่แอดมินสร้างผ่านหน้าเก็บข้อมูลรุ่น)
  // ล็อกอินไม่ได้จนกว่าจะมีการตั้งรหัสผ่านจริงให้ — ห้ามใส่รหัสผ่านเริ่มต้นสาธารณะ (เช่น '123456')
  // กลับเข้ามาอีก เพราะเป็นช่องโหว่ที่ทำให้ใครก็ล็อกอินเป็นบัญชีเหล่านี้ได้
  if (!user.password_hash) {
    await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
    return null;
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) return null;

  return user as UserSession;
}

/**
 * เช็ก rate limit ก่อนอนุญาตให้ authenticateUser ทำงาน — ถ้า identifier นี้ล็อกอินผิด
 * ครบจำนวนสูงสุดภายในช่วงเวลาที่กำหนดแล้ว ให้ปฏิเสธทันทีโดยไม่ต้องเช็ครหัสผ่านอีก
 * (ป้องกัน brute-force เดารหัสผ่าน — เดิมไม่มีการจำกัดจำนวนครั้งเลย)
 */
export async function checkLoginRateLimit(identifier: string): Promise<void> {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS failed_count
     FROM login_attempts
     WHERE identifier = $1 AND success = false
       AND created_at > now() - interval '${LOGIN_RATE_LIMIT_WINDOW_TEXT}'`,
    [identifier.trim().toLowerCase()]
  );
  if ((rows[0]?.failed_count ?? 0) >= LOGIN_RATE_LIMIT_MAX_ATTEMPTS) {
    throw new Error('เข้าสู่ระบบผิดพลาดหลายครั้งเกินไป กรุณาลองใหม่อีกครั้งใน 15 นาที');
  }
}

/** บันทึกผลการล็อกอินแต่ละครั้งไว้ใช้คำนวณ rate limit — ไม่ throw แม้บันทึกไม่สำเร็จ */
export async function recordLoginAttempt(identifier: string, success: boolean): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO login_attempts (identifier, success) VALUES ($1, $2)`,
      [identifier.trim().toLowerCase(), success]
    );
    // เก็บกวาดของเก่าแบบขี้เกียจ (opportunistic) ไม่ต้องมี cron แยกต่างหาก
    await pool.query(`DELETE FROM login_attempts WHERE created_at < now() - interval '1 day'`);
  } catch (err) {
    console.error('[recordLoginAttempt] failed:', err);
  }
}

/** สร้าง Session และเก็บลง DB */
export async function createSession(userId: number): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await pool.query(
    `INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)`,
    [sessionId, userId, expiresAt]
  );

  // เก็บกวาด session ที่หมดอายุแล้วแบบขี้เกียจ (opportunistic) ไม่ต้องมี cron แยกต่างหาก —
  // ไม่มีตรงไหนในระบบเดิมลบแถวหมดอายุออกเลย ปล่อยไว้จะค้างสะสมในตารางไปเรื่อยๆ
  try {
    await pool.query(`DELETE FROM sessions WHERE expires_at < now()`);
  } catch (err) {
    console.error('[createSession] expired session cleanup failed:', err);
  }

  return sessionId;
}

/** ดึงข้อมูลผู้ใช้จาก Session ID */
export async function getSessionUser(sessionId: string): Promise<UserSession | null> {
  if (!sessionId) return null;

  const { rows } = await pool.query(
    `SELECT u.id, u.student_id, u.email, u.name, u.role, u.status, u.student_status,
            u.total_points, u.avatar_url, u.company, u.position, u.bio, u.is_available_for_mentorship,
            u.show_hometown_on_map, u.show_workplace_on_map, u.birth_date,
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
  } catch (err) {
    // เดิม catch เงียบไม่ log อะไรเลย ทำให้ debug ปัญหา session/DB จริงไม่ได้ (เห็นแค่ 401/403
    // ปลายทางโดยไม่รู้สาเหตุ) — log ไว้เพื่อให้เห็นใน `docker compose logs app` เสมอ
    console.error('[getCurrentUser] session lookup failed:', err);
    return null;
  }
}
