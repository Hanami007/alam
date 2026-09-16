import { getCurrentUser } from '@/lib/auth';
import { adminDbService } from '@/modules/admin/services/admin.service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stats = await adminDbService.getOverviewStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    console.error('[API /api/admin/overview] Error:', err);
    return NextResponse.json({ error: err.message || 'Error loading overview' }, { status: 500 });
  }
}
