import { getCurrentUser } from '@/lib/auth';
import { hofResultsService } from '@/modules/hall-of-fame/services/hof-results.service';
import { NextResponse } from 'next/server';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

/**
 * POST /api/admin/hof-campaign/finalize
 * Lock TOP 10 → Snapshot เข้า hof_results
 * ทำได้แค่ครั้งเดียวต่อ campaign (re-finalize ได้ถ้า admin ต้องการแก้)
 *
 * Body: { "campaign_id": 2 }
 */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const campaignId = Number(body.campaign_id);

  if (!campaignId || isNaN(campaignId)) {
    return NextResponse.json({ error: 'กรุณาระบุ campaign_id' }, { status: 400 });
  }

  try {
    const top10 = await hofResultsService.finalizeCampaign(campaignId, admin.id);
    return NextResponse.json({
      success: true,
      message: `บันทึก TOP ${top10.length} สำเร็จ`,
      top10,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
