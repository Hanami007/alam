import { getCurrentUser } from '@/lib/auth';
import { hofResultsService } from '@/modules/hall-of-fame/services/hof-results.service';
import { NextResponse } from 'next/server';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

/**
 * POST /api/admin/hof-campaign/new
 * สร้าง campaign รอบใหม่ (ปิดรอบเก่าอัตโนมัติ)
 *
 * Body:
 * {
 *   "title": "ศิษย์เก่าดีเด่น Q3/2569",
 *   "period_start": "2569-07-01",
 *   "period_end": "2569-09-30",
 *   "quarter": "Q3/2569"          // optional
 * }
 */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { title, period_start, period_end, quarter } = body;

  if (!title || !period_start || !period_end) {
    return NextResponse.json(
      { error: 'กรุณาระบุ title, period_start, period_end' },
      { status: 400 }
    );
  }

  // ตรวจสอบ period_end ต้องหลัง period_start
  if (new Date(period_end) <= new Date(period_start)) {
    return NextResponse.json(
      { error: 'period_end ต้องมาหลัง period_start' },
      { status: 400 }
    );
  }

  try {
    const campaign = await hofResultsService.createNewCycle(admin.id, {
      title,
      periodStart: period_start,
      periodEnd: period_end,
      quarter,
    });
    return NextResponse.json({ success: true, campaign });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
