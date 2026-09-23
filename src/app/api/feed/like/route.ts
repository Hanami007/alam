import { feedDbService } from '@/modules/feed/services/feed.service';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนกดถูกใจ' }, { status: 401 });
    }
    const { postId } = await req.json();
    if (!postId) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }
    // ใช้ user.id จาก session เสมอ — ห้ามเชื่อ userId ที่ client ส่งมา (กันกดถูกใจแทนคนอื่น)
    const result = await feedDbService.toggleLike(Number(postId), user.id);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
