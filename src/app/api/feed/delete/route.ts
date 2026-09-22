import { feedDbService } from '@/modules/feed/services/feed.service';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // ตรวจสอบสิทธิ์จาก session เท่านั้น — ห้ามเชื่อ adminId ที่ client ส่งมา
    // (เดิมรับ adminId จาก body ตรงๆ แล้วเช็ค role จาก id นั้น ทำให้ปลอมเป็นแอดมินได้
    // แค่เดา/รู้ id ของแอดมินจริง โดยไม่ต้อง login เป็นแอดมินเลย)
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'สิทธิ์ไม่เพียงพอ: เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบฟีดข่าวได้',
        },
        { status: 403 }
      );
    }

    const { postId } = await req.json();
    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ครบถ้วน (ต้องการ postId)' },
        { status: 400 }
      );
    }

    const deleted = await feedDbService.deletePost(Number(postId), user.id);
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
