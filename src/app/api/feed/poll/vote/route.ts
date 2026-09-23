import { feedDbService } from '@/modules/feed/services/feed.service';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pollId, optionId } = body;
    // ใช้ user.id จาก session เสมอ — ห้ามเชื่อ userId ที่ client ส่งมา (กันโหวตแทนคนอื่น)
    const sessionUser = await getCurrentUser();

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบก่อนโหวต' },
        { status: 401 }
      );
    }
    if (!pollId || !optionId) {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      );
    }

    const result = await feedDbService.votePoll(
      Number(pollId),
      Number(optionId),
      sessionUser.id
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
