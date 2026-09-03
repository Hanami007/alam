import { getCurrentUser } from '@/lib/auth';
import { getPendingBatchmates, approveBatchmate, pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let genId = user.generation_option_id;

    // ถ้ายังไม่มี generation_option_id ใน session ให้ query จาก DB ตรงๆ
    if (!genId) {
      const { rows } = await pool.query(`SELECT generation_option_id FROM users WHERE id = $1`, [user.id]);
      genId = rows[0]?.generation_option_id;
    }

    if (!genId && user.role !== 'admin') {
      return NextResponse.json({
        pendingBatchmates: [],
        message: 'คุณยังไม่ได้ระบุรุ่นของคุณในโปรไฟล์',
      });
    }

    let pendingBatchmates = [];
    if (genId) {
      pendingBatchmates = await getPendingBatchmates(genId);
    } else if (user.role === 'admin') {
      // แอดมินสามารถดูทั้งหมดได้
      const { rows } = await pool.query(
        `SELECT u.id, u.student_id, u.name, u.email, u.student_status, u.admission_year,
                u.created_at, gen.label as generation, prov.label as province
         FROM users u
         LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
         LEFT JOIN lookup_options prov ON prov.id = u.province_option_id
         WHERE u.status = 'pending'
         ORDER BY u.created_at DESC`
      );
      pendingBatchmates = rows;
    }

    return NextResponse.json({
      pendingBatchmates,
      userGeneration: user.generation,
    });
  } catch (err: any) {
    console.error('[API /api/member/approvals] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { applicantId } = body;

    if (!applicantId) {
      return NextResponse.json({ error: 'Missing applicantId' }, { status: 400 });
    }

    const approved = await approveBatchmate(Number(applicantId), user.id);

    return NextResponse.json({
      success: true,
      message: 'ยืนยันตัวตนเพื่อนร่วมรุ่นสำเร็จแล้ว!',
      applicant: approved,
    });
  } catch (err: any) {
    console.error('[API POST /api/member/approvals] Error:', err);
    return NextResponse.json({ error: err.message || 'เกิดข้อผิดพลาดในการยืนยันตัวตน' }, { status: 400 });
  }
}
