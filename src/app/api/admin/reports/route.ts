import { getCurrentUser } from '@/lib/auth';
import { publicErrorMessage } from '@/lib/api-error';
import {
  reportDbService,
  type ReportAction,
  type ReportTargetType,
} from '@/modules/moderation/services/report.service';
import { NextResponse } from 'next/server';

async function requireAdmin() {
  const user = await getCurrentUser();
  return user && user.role === 'admin' ? user : null;
}

/** GET /api/admin/reports?status=pending|resolved — คิวรายงานเนื้อหา (รวมตามเนื้อหา) */
export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const status = new URL(req.url).searchParams.get('status') === 'resolved' ? 'resolved' : 'pending';
    const [items, pendingCount] = await Promise.all([
      reportDbService.getQueue(status),
      reportDbService.countPending(),
    ]);
    return NextResponse.json({ items, pendingCount });
  } catch (err: any) {
    console.error('[API /api/admin/reports GET] Error:', err);
    return NextResponse.json({ error: publicErrorMessage(err) }, { status: 500 });
  }
}

/** PATCH /api/admin/reports { targetType, targetId, action: hide|unhide|delete|dismiss } */
export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const targetType = body.targetType as ReportTargetType;
    const targetId = Number(body.targetId);
    const action = body.action as ReportAction;
    if (
      !['post', 'comment'].includes(targetType) ||
      !Number.isInteger(targetId) ||
      !['hide', 'unhide', 'delete', 'dismiss'].includes(action)
    ) {
      return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }
    const result = await reportDbService.resolve(targetType, targetId, action, admin.id);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[API /api/admin/reports PATCH] Error:', err);
    return NextResponse.json({ error: publicErrorMessage(err) }, { status: 500 });
  }
}
