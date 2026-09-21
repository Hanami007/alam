import { getCurrentUser } from '@/lib/auth';
import { galleryDbService } from '@/modules/gallery/services/gallery.service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนปลดล็อกรูปภาพ' }, { status: 401 });
    }
    const body = await req.json();
    const photoId = body.photoId || body.assetId;
    const answer = body.answer || '';

    if (!photoId) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }

    // ใช้ user.id จาก session เสมอ — ห้ามเชื่อ userId ที่ client ส่งมา (กันปลดล็อก/รับแต้มแทนคนอื่น)
    const result = await galleryDbService.unlockPhoto(user.id, photoId, answer);

    return NextResponse.json({
      success: true,
      pointsEarned: result.pointsEarned,
    });
  } catch (err: any) {
    console.error('Gallery unlock error:', err);
    return NextResponse.json({ error: err.message || 'เกิดข้อผิดพลาดในการปลดล็อก' }, { status: 500 });
  }
}