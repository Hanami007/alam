import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth';
import { pool } from '@/lib/db';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * สมาชิกเปลี่ยนรหัสผ่านของตัวเอง — ต้องยืนยันรหัสผ่านเดิมก่อนเสมอ
 * (กันคนที่แอบใช้เครื่องที่ล็อกอินค้างไว้มาเปลี่ยนรหัสแล้วยึดบัญชี)
 * เปลี่ยนสำเร็จแล้วจะออกจากระบบทุกเครื่องอื่น ยกเว้นเครื่องที่ใช้อยู่ตอนนี้
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'กรุณากรอกรหัสผ่านเดิมและรหัสผ่านใหม่' }, { status: 400 });
    }
    // กติกาเดียวกับหน้าสมัคร (/api/auth/register)
    if (String(newPassword).length < 6) {
      return NextResponse.json({ error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
    }
    if (currentPassword === newPassword) {
      return NextResponse.json({ error: 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม' }, { status: 400 });
    }

    const { rows } = await pool.query(`SELECT password_hash FROM users WHERE id = $1`, [user.id]);
    const isValid = await verifyPassword(String(currentPassword), rows[0]?.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'รหัสผ่านเดิมไม่ถูกต้อง' }, { status: 400 });
    }

    const newHash = await hashPassword(String(newPassword));
    const sessionId = (await cookies()).get('session_id')?.value ?? '';
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [newHash, user.id]);
      await client.query(`DELETE FROM sessions WHERE user_id = $1 AND id <> $2`, [user.id, sessionId]);
      await client.query(
        `INSERT INTO audit_logs (actor_id, action, target_type, target_id) VALUES ($1, 'change_password', 'user', $1)`,
        [user.id]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API /api/user/password] Error:', err);
    return NextResponse.json({ error: 'เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
  }
}
