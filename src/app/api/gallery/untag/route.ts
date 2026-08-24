import { removeUserPhotoTag } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { mediaAssetId, userId } = await req.json();

    if (!mediaAssetId || !userId) {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ครบถ้วน (ต้องการ mediaAssetId, userId)' },
        { status: 400 }
      );
    }

    const removed = await removeUserPhotoTag(Number(mediaAssetId), Number(userId));

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
