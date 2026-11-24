import { publicErrorMessage } from '@/lib/api-error';
import { getCurrentUser } from '@/lib/auth';
import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * POST /api/yearbook/like { userId } — สลับ ถูกใจ / ยกเลิก หน้าหนังสือรุ่นของ userId
 * คนกดใช้ user.id จาก session เสมอ และกดถูกใจหน้าของตัวเองไม่ได้
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนกดถูกใจ' }, { status: 401 });
    }

    const { userId } = await req.json();
    const targetId = Number(userId);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }
    if (targetId === user.id) {
      return NextResponse.json({ error: 'กดถูกใจหนังสือรุ่นของตัวเองไม่ได้' }, { status: 400 });
    }

    // ถูกใจได้เฉพาะหน้าที่แสดงอยู่ในหนังสือรุ่นจริง (เงื่อนไขเดียวกับ GET /api/admin/yearbook)
    const { rows: target } = await pool.query(
      `SELECT 1 FROM users WHERE id = $1 AND yearbook_published = true AND status = 'approved'`,
      [targetId]
    );
    if (target.length === 0) {
      return NextResponse.json({ error: 'ไม่พบหน้านี้ในหนังสือรุ่น' }, { status: 404 });
    }

    const { rowCount: removed } = await pool.query(
      `DELETE FROM yearbook_likes WHERE user_id = $1 AND liked_by = $2`,
      [targetId, user.id]
    );
    if (!removed) {
      // ON CONFLICT กันกดรัวสองแท็บพร้อมกันแล้วชน UNIQUE (user_id, liked_by)
      await pool.query(
        `INSERT INTO yearbook_likes (user_id, liked_by) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [targetId, user.id]
      );
    }

    const { rows: stat } = await pool.query(
      `SELECT COUNT(*)::int AS count FROM yearbook_likes WHERE user_id = $1`,
      [targetId]
    );
    return NextResponse.json({ success: true, liked: !removed, count: stat[0]?.count ?? 0 });
  } catch (err: any) {
    console.error('[API /api/yearbook/like] Error:', err);
    return NextResponse.json({ error: publicErrorMessage(err) }, { status: 500 });
  }
}
