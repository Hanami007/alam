import { getCurrentUser } from '@/lib/auth';
import { pool } from '@/lib/db';
import { publicErrorMessage } from '@/lib/api-error';
import { memberDbService } from '@/modules/member/services/member.service';
import { leaderService } from '@/modules/member/services/leader.service';
import { NextResponse } from 'next/server';

/**
 * GET /api/member/approvals
 *  - แอดมิน: เห็นผู้สมัครที่รอยืนยันทุกรุ่น
 *  - หัวหน้ารุ่น: เห็นเฉพาะผู้สมัครของรุ่นที่ตัวเองเป็นหัวหน้า
 *  - สมาชิกทั่วไป: ไม่เห็นคิว (ยืนยันสมาชิกได้เฉพาะหัวหน้ารุ่น)
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const isAdmin = user.role === 'admin';

    if (isAdmin) {
      const { rows } = await pool.query(
        `SELECT u.id, u.student_id, u.name, u.email, u.student_status, u.admission_year,
                u.created_at, gen.label as generation, prov.label as province
         FROM users u
         LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
         LEFT JOIN lookup_options prov ON prov.id = u.province_option_id
         WHERE u.status = 'pending'
         ORDER BY u.created_at DESC`
      );
      return NextResponse.json({ pendingBatchmates: rows, userGeneration: 'ทุกรุ่น', isAdmin: true });
    }

    const leaderOf = await leaderService.getLeaderGeneration(user.id);
    if (!leaderOf) {
      return NextResponse.json({
        pendingBatchmates: [],
        isAdmin: false,
        leaderGeneration: null,
        message: 'เฉพาะหัวหน้ารุ่นเท่านั้นที่ยืนยันสมาชิกใหม่ได้ ติดต่อผู้ดูแลระบบหากต้องการเป็นหัวหน้ารุ่น',
      });
    }

    const pendingBatchmates = await memberDbService.getPendingBatchmates(leaderOf.id);
    return NextResponse.json({
      pendingBatchmates,
      userGeneration: leaderOf.label,
      leaderGeneration: leaderOf,
      isAdmin: false,
    });
  } catch (err) {
    console.error('[API /api/member/approvals] Error:', err);
    return NextResponse.json({ error: publicErrorMessage(err, 'ไม่สามารถโหลดรายชื่อผู้รอยืนยันได้') }, { status: 500 });
  }
}

/**
 * POST /api/member/approvals  { applicantId, action?: 'approve' | 'reject', remark? }
 *  - approve: หัวหน้ารุ่นของผู้สมัคร หรือแอดมิน
 *  - reject:  แอดมินเท่านั้น
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const applicantId = Number(body?.applicantId);
    const action = body?.action === 'reject' ? 'reject' : 'approve';

    if (!Number.isInteger(applicantId) || applicantId <= 0) {
      return NextResponse.json({ error: 'Missing applicantId' }, { status: 400 });
    }

    if (action === 'reject') {
      if (user.role !== 'admin') {
        return NextResponse.json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่ปฏิเสธผู้สมัครได้' }, { status: 403 });
      }
      const remark = typeof body?.remark === 'string' ? body.remark.slice(0, 500) : undefined;
      const rejected = await memberDbService.rejectApplicant(applicantId, user.id, remark);
      return NextResponse.json({ success: true, message: 'ปฏิเสธผู้สมัครแล้ว', applicant: rejected });
    }

    const approved = await memberDbService.approveBatchmate(applicantId, user.id);
    return NextResponse.json({
      success: true,
      message: 'ยืนยันตัวตนสำเร็จแล้ว!',
      applicant: approved,
    });
  } catch (err) {
    console.error('[API POST /api/member/approvals] Error:', err);
    return NextResponse.json({ error: publicErrorMessage(err, 'เกิดข้อผิดพลาดในการยืนยันตัวตน') }, { status: 400 });
  }
}
