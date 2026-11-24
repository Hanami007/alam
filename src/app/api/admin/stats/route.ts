import { getCurrentUser } from '@/lib/auth';
import { publicErrorMessage } from '@/lib/api-error';
import { adminStatsService } from '@/modules/admin/services/stats.service';
import { NextResponse } from 'next/server';

/** GET /api/admin/stats — สถิติภาพรวมสำหรับแท็บ "สถิติ" (แอดมินเท่านั้น) */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(await adminStatsService.getStats());
  } catch (err: any) {
    console.error('[API /api/admin/stats] Error:', err);
    return NextResponse.json({ error: publicErrorMessage(err, 'โหลดสถิติไม่สำเร็จ') }, { status: 500 });
  }
}
