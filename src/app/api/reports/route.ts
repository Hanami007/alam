import { getCurrentUser } from '@/lib/auth';
import { publicErrorMessage } from '@/lib/api-error';
import {
  reportDbService,
  type ReportReason,
  type ReportTargetType,
} from '@/modules/moderation/services/report.service';
import { NextResponse } from 'next/server';

/** POST /api/reports — ผู้ใช้รายงานโพสต์หรือความคิดเห็น { targetType, targetId, reason, detail? } */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนรายงานเนื้อหา' }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const targetType = body.targetType as ReportTargetType;
    const targetId = Number(body.targetId);
    if (!['post', 'comment'].includes(targetType) || !Number.isInteger(targetId) || targetId <= 0) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }

    // ใช้ user.id จาก session เสมอ — ห้ามเชื่อ reporterId จาก client
    const { created } = await reportDbService.createReport(
      user.id,
      targetType,
      targetId,
      body.reason as ReportReason,
      typeof body.detail === 'string' ? body.detail : undefined
    );

    return NextResponse.json({
      success: true,
      alreadyReported: !created,
      message: created
        ? 'ส่งรายงานแล้ว ผู้ดูแลระบบจะตรวจสอบโดยเร็ว'
        : 'คุณเคยรายงานเนื้อหานี้ไปแล้ว ผู้ดูแลระบบกำลังตรวจสอบ',
    });
  } catch (err: any) {
    console.error('[API /api/reports] Error:', err);
    return NextResponse.json({ error: publicErrorMessage(err, 'ส่งรายงานไม่สำเร็จ') }, { status: 400 });
  }
}
