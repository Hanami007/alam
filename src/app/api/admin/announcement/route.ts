import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { title, body: contentText, category, imageUrl, pinned } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุหัวข้อประกาศ' }, { status: 400 });
    }

    const adminUserId = user.id;

    const { rows: insertedPost } = await pool.query(
      `INSERT INTO posts (admin_id, title, content, category, status, pinned, published_at, created_at)
       VALUES ($1, $2, $3, $4, 'published', $5, NOW(), NOW())
       RETURNING id, title, content, category, pinned, created_at`,
      [adminUserId, title.trim(), contentText?.trim() || '', category || 'ประกาศทางการ', pinned ? true : false]
    );

    return NextResponse.json({
      success: true,
      message: 'สร้างประกาศทางการและแสดงผลบนวอลล์เรียบร้อยแล้ว',
      post: insertedPost[0],
    });
  } catch (err: any) {
    console.error('[API /api/admin/announcement] Error:', err);
    return NextResponse.json({ error: err.message || 'Error publishing admin announcement' }, { status: 500 });
  }
}
