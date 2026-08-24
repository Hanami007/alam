import { deletePost, getUserById } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { postId, adminId } = await req.json();

    if (!postId || !adminId) {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ครบถ้วน (ต้องการ postId และ adminId)' },
        { status: 400 }
      );
    }

    // ตรวจสอบสิทธิ์ผู้ใช้งานว่ามีสถานะเป็น Admin หรือไม่
    const user = await getUserById(Number(adminId));
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'สิทธิ์ไม่เพียงพอ: เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบฟีดข่าวได้',
        },
        { status: 403 }
      );
    }

    const deleted = await deletePost(Number(postId), Number(adminId));
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบโพสต์ที่ต้องการลบ หรือโพสต์ถูกลบไปแล้ว' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ลบโพสต์ข่าวเรียบร้อยแล้ว',
      deleted,
    });
  } catch (err: any) {
    console.error('Error deleting post:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'เกิดข้อผิดพลาดในการลบโพสต์' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  return POST(req);
}
