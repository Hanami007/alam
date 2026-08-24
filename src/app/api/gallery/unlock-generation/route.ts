import { getCurrentUser } from '@/lib/auth';
import { galleryDbService } from '@/services/db/gallery.service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const userId = body.userId ? Number(body.userId) : user?.id || 1;
    const generation = body.generation;
    const answer = body.answer || '';

    if (!generation) {
      return NextResponse.json({ error: 'กรุณาระบุรุ่นที่ต้องการปลดล็อก' }, { status: 400 });
    }

    const result = await galleryDbService.unlockGeneration(userId, generation, answer);

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
