import { castPollVote } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { pollId, optionId, userId } = await req.json();

    if (!pollId || !optionId || !userId) {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ครบถ้วน (ต้องการ pollId, optionId, userId)' },
        { status: 400 }
      );
    }

    const result = await castPollVote(
      Number(pollId),
      Number(optionId),
      Number(userId)
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'ไม่สามารถบันทึกการโหวตได้' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `โหวตสำเร็จ! ได้รับ +${result.pointsAwarded ?? 0} คะแนน`,
      pointsAwarded: result.pointsAwarded ?? 0,
    });
  } catch (err: any) {
    console.error('Error voting in poll:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'เกิดข้อผิดพลาดในการโหวต' },
      { status: 500 }
    );
  }
}
