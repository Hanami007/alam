import { getCurrentUser } from '@/lib/auth';
import { galleryDbService } from '@/modules/gallery/services/gallery.service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const userId = body.userId ? Number(body.userId) : user?.id;
    const photoId = body.photoId || body.assetId;
    const answer = body.answer || '';

    if (!userId || !photoId) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }

    const result = await galleryDbService.unlockPhoto(userId, photoId, answer);

    return NextResponse.json({
      success: true,
      pointsEarned: result.pointsEarned,
    });
  } catch (err: any) {
    console.error('Gallery unlock error:', err);
    return NextResponse.json({ error: err.message || 'เกิดข้อผิดพลาดในการปลดล็อก' }, { status: 500 });
  }
}