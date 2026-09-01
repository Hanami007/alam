import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { rows } = await pool.query(`
      SELECT 
        u.id,
        u.student_id as "studentId",
        u.name,
        COALESCE(u.nickname, '') as nickname,
        COALESCE(gen.label, 'รุ่น 43') as generation,
        COALESCE(u.avatar_url, 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=600&q=80') as "avatarUrl",
        COALESCE(u.bio, '') as quote,
        u.created_at
      FROM users u
      LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
      ORDER BY u.id DESC
    `);

    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('[API /api/admin/yearbook GET] Error:', err);
    return NextResponse.json({ error: err.message || 'Error fetching yearbook list' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { name, nickname, avatarUrl, quote, generation } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อ-นามสกุล' }, { status: 400 });
    }

    // Find generation option id or default
    let genOptionId = 1;
    if (generation) {
      const { rows } = await pool.query(
        `SELECT id FROM lookup_options WHERE category = 'generation' AND label = $1 LIMIT 1`,
        [generation]
      );
      if (rows[0]) genOptionId = rows[0].id;
    }

    const studentIdRandom = `MJ${Math.floor(10000000 + Math.random() * 90000000)}`;

    const { rows: inserted } = await pool.query(
      `INSERT INTO users (name, nickname, avatar_url, bio, generation_option_id, student_id, role, status, email)
       VALUES ($1, $2, $3, $4, $5, $6, 'alumni', 'approved', $7)
       RETURNING id, name, nickname, avatar_url as "avatarUrl", bio as quote`,
      [
        name.trim(),
        nickname?.trim() || '',
        avatarUrl?.trim() || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=600&q=80',
        quote?.trim() || '',
        genOptionId,
        studentIdRandom,
        `alumni_${Date.now()}@mju.ac.th`
      ]
    );

    return NextResponse.json({ success: true, data: inserted[0] });
  } catch (err: any) {
    console.error('[API /api/admin/yearbook POST] Error:', err);
    return NextResponse.json({ error: err.message || 'Error creating yearbook entry' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, nickname, avatarUrl, quote, generation } = body;

    if (!id) {
      return NextResponse.json({ error: 'ไม่พบ ID ที่ต้องการแก้ไข' }, { status: 400 });
    }

    let genOptionId: number | null = null;
    if (generation) {
      const { rows } = await pool.query(
        `SELECT id FROM lookup_options WHERE category = 'generation' AND label = $1 LIMIT 1`,
        [generation]
      );
      if (rows[0]) genOptionId = rows[0].id;
    }

    await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           nickname = COALESCE($2, nickname),
           avatar_url = COALESCE($3, avatar_url),
           bio = COALESCE($4, bio),
           generation_option_id = COALESCE($5, generation_option_id)
       WHERE id = $6`,
      [name?.trim(), nickname?.trim(), avatarUrl?.trim(), quote?.trim(), genOptionId, id]
    );

    return NextResponse.json({ success: true, message: 'แก้ไขข้อมูลหนังสือรุ่นเรียบร้อย' });
  } catch (err: any) {
    console.error('[API /api/admin/yearbook PUT] Error:', err);
    return NextResponse.json({ error: err.message || 'Error updating yearbook entry' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ไม่พบ ID ที่ต้องการลบ' }, { status: 400 });
    }

    await pool.query(`DELETE FROM users WHERE id = $1`, [id]);

    return NextResponse.json({ success: true, message: 'ลบข้อมูลหนังสือรุ่นเรียบร้อย' });
  } catch (err: any) {
    console.error('[API /api/admin/yearbook DELETE] Error:', err);
    return NextResponse.json({ error: err.message || 'Error deleting yearbook entry' }, { status: 500 });
  }
}
