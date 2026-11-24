import { getCurrentUser } from '@/lib/auth';
import { publicErrorMessage } from '@/lib/api-error';
import { leaderService } from '@/modules/member/services/leader.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * คำถามปลดล็อกคลังภาพของรุ่น (รวมคำตอบ — เห็นเฉพาะคนที่แก้ได้)
 *  - หัวหน้ารุ่น: รุ่นของตัวเองเท่านั้น (ไม่ต้องส่ง generationId)
 *  - แอดมิน: รุ่นไหนก็ได้ (ส่ง generationId)
 *  GET ?generationId=   |   PUT { generationId?, question, answers: string[] }
 */
async function resolveGeneration(generationIdParam: unknown): Promise<
  { ok: true; generationId: number; userId: number } | { ok: false; status: number; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, status: 401, error: 'กรุณาเข้าสู่ระบบ' };

  if (user.role === 'admin') {
    const id = Number(generationIdParam);
    if (!Number.isInteger(id) || id <= 0) return { ok: false, status: 400, error: 'กรุณาเลือกรุ่น' };
    return { ok: true, generationId: id, userId: user.id };
  }

  const leaderOf = await leaderService.getLeaderGeneration(user.id);
  if (!leaderOf) return { ok: false, status: 403, error: 'เฉพาะหัวหน้ารุ่นหรือผู้ดูแลระบบเท่านั้น' };
  if (generationIdParam !== undefined && generationIdParam !== null && Number(generationIdParam) !== leaderOf.id) {
    return { ok: false, status: 403, error: 'หัวหน้ารุ่นแก้ได้เฉพาะคำถามของรุ่นตัวเอง' };
  }
  return { ok: true, generationId: leaderOf.id, userId: user.id };
}

export async function GET(req: NextRequest) {
  try {
    const r = await resolveGeneration(req.nextUrl.searchParams.get('generationId') ?? undefined);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
    const question = await leaderService.getQuestion(r.generationId);
    return NextResponse.json({ generationId: r.generationId, question });
  } catch (err) {
    console.error('[API /api/generation/unlock-question GET] Error:', err);
    return NextResponse.json({ error: publicErrorMessage(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const r = await resolveGeneration(body.generationId);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
    const answers = Array.isArray(body.answers) ? body.answers.map((a: unknown) => String(a ?? '')) : [];
    await leaderService.setQuestion(r.generationId, String(body.question ?? ''), answers, r.userId);
    return NextResponse.json({ success: true, question: await leaderService.getQuestion(r.generationId) });
  } catch (err) {
    console.error('[API /api/generation/unlock-question PUT] Error:', err);
    return NextResponse.json({ error: publicErrorMessage(err, 'บันทึกคำถามไม่สำเร็จ') }, { status: 400 });
  }
}
