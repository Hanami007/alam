import { hofDbService } from '@/modules/hall-of-fame/services/hof.service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [candidates, campaign] = await Promise.all([
      hofDbService.getCandidates(),
      hofDbService.getCampaignStatus(),
    ]);
    return NextResponse.json({
      candidates,
      campaignStatus: campaign?.status ?? 'closed',
      campaignTitle: campaign?.title ?? null,
    });
  } catch (err: any) {
    console.error('[API /api/hof] Error:', err);
    return NextResponse.json({ error: err.message || 'ไม่สามารถโหลดข้อมูลศิษย์เก่าดีเด่นได้' }, { status: 500 });
  }
}
