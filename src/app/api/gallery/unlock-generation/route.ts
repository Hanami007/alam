import { getCurrentUser } from '@/lib/auth';
import { galleryDbService } from '@/modules/gallery/services/gallery.service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนปลดล็อกทำเนียบรุ่น' }, { status: 401 });
    }
    const body = await req.json();
    const generation = body.generation;
    const answer = body.answer || '';

    if (!generation) {
      return NextResponse.json({ error: 'กรุณาระบุรุ่นที่ต้องการปลดล็อก' }, { status: 400 });
    }

    // ใช้ user.id จาก session เสมอ — ห้ามเชื่อ userId ที่ client ส่งมา (กันปลดล็อก/รับแต้มแทนคนอื่น)
    const result = await galleryDbService.unlockGeneration(user.id, generation, answer);

    return NextResponse.json({
      success: true,
      pointsEarned: result.pointsEarned,
      alreadyUnlocked: result.alreadyUnlocked,
    });
  } catch (err: any) {
    console.error('Generation unlock error:', err);
    return NextResponse.json({ error: err.message || 'เกิดข้อผิดพลาดในการปลดล็อก' }, { status: 500 });
  }
}
