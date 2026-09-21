import { galleryDbService } from '@/modules/gallery/services/gallery.service';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'กรุณาเข้าสู่ระบบก่อนลบแท็ก' }, { status: 401 });
    }

    const { mediaAssetId } = await req.json();

    if (!mediaAssetId) {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ครบถ้วน (ต้องการ mediaAssetId)' },
        { status: 400 }
      );
    }

    // ลบแท็กของตัวเองเท่านั้น — ใช้ user.id จาก session เสมอ ห้ามเชื่อ userId ที่ client ส่งมา
    const removed = await galleryDbService.removeUserPhotoTag(Number(mediaAssetId), user.id);

    if (!removed) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบแท็กนี้ หรือแท็กถูกลบไปแล้ว' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ลบแท็กตัวคุณออกจากรูปนี้เรียบร้อยแล้ว ✨',
    });
  } catch (err: any) {
    console.error('Error removing tag:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'เกิดข้อผิดพลาดในการลบแท็ก' },
      { status: 500 }
    );
  }
}
