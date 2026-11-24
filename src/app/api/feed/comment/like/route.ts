import { feedDbService } from '@/modules/feed/services/feed.service';
import { publicErrorMessage } from '@/lib/api-error';
import { getCurrentUser } from '@/lib/auth';
import { isAllowedCommentEmoji } from '@/lib/reactions';
import { NextResponse } from 'next/server';

/**
 * POST /api/feed/comment/like { commentId, emoji? }
 * - ไม่ส่ง emoji = กดปุ่ม "ถูกใจ" (สลับ ถูกใจ/ยกเลิก)
 * - ส่ง emoji = เลือกจากแถบอีโมจิ (ตั้ง/เปลี่ยนอีโมจิ ไม่ยกเลิก)
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนกดถูกใจ' }, { status: 401 });
    }

    const { commentId, emoji } = await req.json();
    const id = Number(commentId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }
    if (emoji !== undefined && !isAllowedCommentEmoji(emoji)) {
      return NextResponse.json({ error: 'อีโมจิไม่ถูกต้อง' }, { status: 400 });
    }

    // ใช้ user.id จาก session เสมอ — ห้ามเชื่อ userId ที่ client ส่งมา
    const result = await feedDbService.reactToComment(id, user.id, emoji);
    if (!result) {
      return NextResponse.json({ error: 'ไม่พบความคิดเห็นนี้' }, { status: 404 });
    }
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[API /api/feed/comment/like] Error:', err);
    return NextResponse.json({ error: publicErrorMessage(err) }, { status: 500 });
  }
}
