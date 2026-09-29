import { getCurrentUser } from '@/lib/auth';
import { hofResultsService } from '@/modules/hall-of-fame/services/hof-results.service';
import { NextResponse } from 'next/server';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

/**
 * GET /api/admin/hof-campaign/history
 * ดูประวัติทุกรอบ + TOP 10 พร้อม status open/closed/finalized
 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const history = await hofResultsService.getAllCycleHistory();
    return NextResponse.json({ success: true, history });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
