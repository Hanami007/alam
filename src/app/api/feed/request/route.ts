import { getCurrentUser } from '@/lib/auth';
import { feedDbService } from '@/modules/feed/services/feed.service';
import { adminDbService } from '@/modules/admin/services/admin.service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { requestedBy, title, content, category, postType, poll } = body;

    const requesterId = user?.id || (requestedBy ? Number(requestedBy) : 1);

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกหัวข้อโพสต์' },
        { status: 400 }
      );
    }

    const type = postType === 'poll' ? 'poll' : 'normal';

    // ตรวจสอบข้อมูลกรณีเป็นโพลแบบสำรวจ
    let pollData = undefined;
    if (type === 'poll') {
      if (!poll || !poll.question?.trim()) {
        return NextResponse.json(
          { success: false, error: 'กรุณาระบุคำถามของโพลแบบสำรวจ' },
          { status: 400 }
        );
      }

      const validOptions = (poll.options || [])
        .map((opt: string) => (typeof opt === 'string' ? opt.trim() : ''))
        .filter((opt: string) => opt.length > 0);

      if (validOptions.length < 2) {
        return NextResponse.json(
          { success: false, error: 'โพลแบบสำรวจต้องมีตัวเลือกอย่างน้อย 2 ตัวเลือก' },
          { status: 400 }
        );
      }

      pollData = {
        question: poll.question.trim(),
        options: validOptions,
        pointsPerVote: Number(poll.pointsPerVote) || 5,
      };
    } else {
      if (!content || !content.trim()) {
        return NextResponse.json(
          { success: false, error: 'กรุณากรอกเนื้อหาของโพสต์' },
          { status: 400 }
        );
      }
    }

    // ──── ตรวจสอบคำต้องห้าม ────
    const textsToCheck = [
      title,
      content ?? '',
      pollData?.question ?? '',
      ...(pollData?.options ?? []),
    ].filter(Boolean);

    const foundKeywords = await adminDbService.checkForBannedKeywords(textsToCheck);
    if (foundKeywords.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `โพสต์ของคุณมีคำที่ไม่เหมาะสม: "${foundKeywords.join('", "')}" กรุณาแก้ไขก่อนส่งอีกครั้ง`,
          bannedWords: foundKeywords,
        },
        { status: 400 }
      );
    }
    // ───────────────────────────

    const post = await feedDbService.submitPostRequest(
      requesterId,
      title.trim(),
      content ? content.trim() : (pollData?.question || ''),
      category ? category.trim() : (type === 'poll' ? 'โพลสำรวจความเห็น' : 'ทั่วไป'),
      type,
      pollData
    );

    return NextResponse.json({
      success: true,
      message: type === 'poll' ? 'สร้างโพลสำเร็จ ✨' : 'สร้างโพสต์สำเร็จ ✨',
      post,
    });
  } catch (err: any) {
    console.error('Error creating post request:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'เกิดข้อผิดพลาดในการส่งคำขอ' },
      { status: 500 }
    );
  }
}