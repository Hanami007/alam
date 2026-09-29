import { getCurrentUser } from '@/lib/auth';
import { hofResultsService } from '@/modules/hall-of-fame/services/hof-results.service';
import { NextResponse } from 'next/server';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

interface RouteParams {
  params: Promise<{ resultId: string }>;
}

/**
 * PUT /api/admin/hof-campaign/results/[resultId]
 * แก้ไข rank หรือ achievement ของ result ใน TOP 10
 *
 * Body: { "rank": 2, "achievement": "ผลงานอัปเดต" }
 */
export async function PUT(req: Request, { params }: RouteParams) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { resultId } = await params;
  const id = Number(resultId);
  if (isNaN(id)) return NextResponse.json({ error: 'resultId ไม่ถูกต้อง' }, { status: 400 });

  const body = await req.json().catch(() => ({}));

  try {
    await hofResultsService.updateResult(id, {
      rank: body.rank !== undefined ? Number(body.rank) : undefined,
      snapshotAchievement: body.achievement,
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/hof-campaign/results/[resultId]
 * ลบ record ออกจาก TOP 10 (ยังคง hof_votes ไว้ ไม่กระทบผลโหวตจริง)
 */
export async function DELETE(_req: Request, { params }: RouteParams) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { resultId } = await params;
  const id = Number(resultId);
  if (isNaN(id)) return NextResponse.json({ error: 'resultId ไม่ถูกต้อง' }, { status: 400 });

  try {
    await hofResultsService.deleteResult(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
