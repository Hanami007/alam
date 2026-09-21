import { feedDbService } from '@/modules/feed/services/feed.service';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น' }, { status: 401 });
    }
    const { postId, content } = await req.json();
    if (!postId || !content?.trim()) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }
    // ใช้ user.id จาก session เสมอ — ห้ามเชื่อ userId ที่ client ส่งมา (กันคอมเมนต์แทนคนอื่น)
    const comment = await feedDbService.addComment(Number(postId), user.id, content.trim());
    return NextResponse.json({ success: true, comment, pointsAwarded: 1 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
