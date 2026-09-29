import { feedDbService } from '@/modules/feed/services/feed.service';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนส่งคำอวยพร' }, { status: 401 });
    }
    const { recipientId } = await req.json();
    if (!recipientId) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }
    // ใช้ user.id จาก session เสมอ — ห้ามเชื่อ senderId ที่ client ส่งมา
    const result = await feedDbService.sendBirthdayWish(user.id, Number(recipientId));
    return NextResponse.json({ success: true, ...result, pointsAwarded: result.alreadySent ? 0 : 1 });
  } catch (err: any) {
    console.error('Error sending birthday wish:', err);
    return NextResponse.json({ error: err.message || 'เกิดข้อผิดพลาดในการส่งคำอวยพร' }, { status: 500 });
  }
}
