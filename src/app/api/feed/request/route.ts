import { createPostRequest } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { requestedBy, title, content, category, postType, poll } = await req.json();

    if (!requestedBy || !title) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลหัวข้อโพสต์และผู้ส่ง' },
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

    const post = await createPostRequest(
      Number(requestedBy),
      title.trim(),
      content ? content.trim() : '',
      category ? category.trim() : (type === 'poll' ? 'โพลสำรวจความเห็น' : 'ทั่วไป'),
      type,
      pollData
    );

    return NextResponse.json({
      success: true,
      message: type === 'poll' ? 'ส่งคำขอสร้างโพลสำเร็จ ✨' : 'ส่งคำขอสร้างโพสต์สำเร็จ ✨',
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