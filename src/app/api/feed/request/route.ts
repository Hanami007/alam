import { getCurrentUser } from '@/lib/auth';
import { publicErrorMessage } from '@/lib/api-error';
import { feedDbService } from '@/modules/feed/services/feed.service';
import { bannedWordsResponse, findBannedWords } from '@/lib/content-filter';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบก่อนสร้างโพสต์' },
        { status: 401 }
      );
    }
    // ใช้ user.id จาก session เท่านั้น — ห้ามเชื่อ requestedBy ที่ client ส่งมา
    // (ป้องกันการโพสต์แอบอ้างเป็นบัญชีคนอื่นโดยไม่ต้องยืนยันตัวตน)
    const requesterId = user.id;

    const body = await req.json();
    const { title, content, category, postType, poll } = body;
    // รูปในโพสต์: data URL (หน้าเว็บย่อรูปก่อนส่ง) — ตรวจชนิด/ขนาด/จำนวนจริงใน feed.service
    const images: unknown = body.images ?? [];
    if (!Array.isArray(images) || images.some((img) => typeof img !== 'string')) {
      return NextResponse.json({ success: false, error: 'รูปแบบรูปภาพไม่ถูกต้อง' }, { status: 400 });
    }

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

    const foundKeywords = await findBannedWords(textsToCheck);
    if (foundKeywords.length > 0) {
      return bannedWordsResponse(foundKeywords, type === 'poll' ? 'โพล' : 'โพสต์');
    }
    // ───────────────────────────

    const post = await feedDbService.submitPostRequest(
      requesterId,
      title.trim(),
      content ? content.trim() : (pollData?.question || ''),
      category ? category.trim() : (type === 'poll' ? 'โพลสำรวจความเห็น' : 'ทั่วไป'),
      type,
      pollData,
      images as string[]
    );

    return NextResponse.json({
      success: true,
      message: type === 'poll' ? 'สร้างโพลสำเร็จ ✨' : 'สร้างโพสต์สำเร็จ ✨',
      post,
    });
  } catch (err: any) {
    console.error('Error creating post request:', err);
    const message = publicErrorMessage(err, '');
    // ข้อความที่ตั้งใจให้ผู้ใช้อ่าน (เช่น รูปใหญ่เกิน, เกินโควตาโพสต์) = ข้อมูลไม่ผ่าน → 400 ไม่ใช่ 500
    return NextResponse.json(
      { success: false, error: message || 'เกิดข้อผิดพลาดในการส่งคำขอ' },
      { status: message ? 400 : 500 }
    );
  }
}