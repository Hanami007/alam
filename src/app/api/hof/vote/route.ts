import { getCurrentUser } from '@/lib/auth';
import { HofVoteError, hofDbService } from '@/modules/hall-of-fame/services/hof.service';
import { NextResponse } from 'next/server';

/** POST /api/hof/vote — กติกาและการบันทึกทั้งหมดอยู่ใน hofDbService.voteCandidate */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const candidateId = Number(body.candidateId);
    if (!Number.isInteger(candidateId) || candidateId <= 0) {
      return NextResponse.json({ success: false, error: 'ไม่พบผู้ได้รับการเสนอชื่อที่เลือก' }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'กรุณาเข้าสู่ระบบก่อนโหวต' }, { status: 401 });
    }

    // ใช้ currentUser.id จาก session เสมอ — ห้ามเชื่อ voterId ที่ client ส่งมา (กันโหวตแทนคนอื่น)
    const result = await hofDbService.voteCandidate(currentUser.id, candidateId);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    if (err instanceof HofVoteError) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.status });
    }
    console.error('Error voting for HOF candidate:', err);
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
  }
}
