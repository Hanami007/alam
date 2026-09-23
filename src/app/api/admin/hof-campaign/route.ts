import { getCurrentUser } from '@/lib/auth';
import { hofDbService } from '@/modules/hall-of-fame/services/hof.service';
import { NextResponse } from 'next/server';

/** GET /api/admin/hof-campaign — ดูสถานะแคมเปญ Hall of Fame ปัจจุบัน (แอดมินเท่านั้น) */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const campaign = await hofDbService.getCampaignStatus();
  return NextResponse.json({ campaign });
}

/** POST /api/admin/hof-campaign — เปิด/ปิดการโหวต Hall of Fame (แอดมินเท่านั้น) */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const status = body.status;
  if (status !== 'open' && status !== 'closed') {
    return NextResponse.json({ error: 'status ต้องเป็น open หรือ closed' }, { status: 400 });
  }

  try {
    const campaign = await hofDbService.setCampaignStatus(status);
    return NextResponse.json({ success: true, campaign });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
