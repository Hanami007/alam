import { feedDbService } from '@/modules/feed/services/feed.service';
import { publicErrorMessage } from '@/lib/api-error';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

/** POST /api/feed/pin { postId, pinned } — แอดมินปักหมุด/เลิกปักหมุดโพสต์ในฟีด */
export async function POST(req: Request) {
  try {
    // ตรวจสิทธิ์จาก session เท่านั้น (เหมือน /api/feed/delete)
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่ปักหมุดโพสต์ได้' },
        { status: 403 }
      );
    }

    const { postId, pinned } = await req.json();
    const id = Number(postId);
    if (!Number.isInteger(id) || id <= 0 || typeof pinned !== 'boolean') {
      return NextResponse.json({ success: false, error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }

    const updated = await feedDbService.setPinned(id, pinned, user.id);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'ไม่พบโพสต์นี้ในฟีด' }, { status: 404 });
    }
    return NextResponse.json({ success: true, pinned });
  } catch (err: any) {
    console.error('[API /api/feed/pin] Error:', err);
    return NextResponse.json({ success: false, error: publicErrorMessage(err) }, { status: 500 });
  }
}
