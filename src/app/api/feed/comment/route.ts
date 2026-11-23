import { feedDbService } from '@/modules/feed/services/feed.service';
import { publicErrorMessage } from '@/lib/api-error';
import { getCurrentUser } from '@/lib/auth';
import { checkLength } from '@/lib/field-limits';
import { bannedWordsResponse, findBannedWords } from '@/lib/content-filter';
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
    // เดิมไม่มีการจำกัดความยาวคอมเมนต์เลยทั้ง client/server ยิง API ตรงใส่ยาวเท่าไหร่ก็ได้
    const lengthError = checkLength(content, 'comment', 'ความคิดเห็น');
    if (lengthError) {
      return NextResponse.json({ error: lengthError }, { status: 400 });
    }
    // เดิมตัวกรองคำใช้กับโพสต์/โพลเท่านั้น ความคิดเห็นหลุดได้ทั้งหมด
    const banned = await findBannedWords([content]);
    if (banned.length > 0) {
      return bannedWordsResponse(banned, 'ความคิดเห็น');
    }
    // ใช้ user.id จาก session เสมอ — ห้ามเชื่อ userId ที่ client ส่งมา (กันคอมเมนต์แทนคนอื่น)
    const comment = await feedDbService.addComment(Number(postId), user.id, content.trim());
    return NextResponse.json({ success: true, comment, pointsAwarded: 1 });
  } catch (err: any) {
    return NextResponse.json({ error: publicErrorMessage(err) }, { status: 500 });
  }
}
