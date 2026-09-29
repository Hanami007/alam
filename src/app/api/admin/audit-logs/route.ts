import { getCurrentUser } from '@/lib/auth';
import { adminDbService } from '@/modules/admin/services/admin.service';
import { NextResponse } from 'next/server';

/** GET /api/admin/audit-logs — ประวัติการดำเนินการของแอดมิน (อนุมัติ/ปฏิเสธ/ลบ ฯลฯ) */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logs = await adminDbService.getAuditLogs(50);
    return NextResponse.json({ logs });
  } catch (err: any) {
    console.error('[API /api/admin/audit-logs] Error:', err);
    return NextResponse.json({ error: err.message || 'Error loading audit logs' }, { status: 500 });
  }
}
