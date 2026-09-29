import { NextResponse } from 'next/server';
import { hofResultsService } from '@/modules/hall-of-fame/services/hof-results.service';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.PUBLIC_API_ALLOWED_ORIGIN ?? '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300', // cache 1 ชั่วโมง (history ไม่เปลี่ยนบ่อย)
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/public/hof/history
 *
 * ดึงประวัติผล TOP 10 ทุกรอบที่ประกาศแล้ว
 *
 * Authentication:
 *   Header: X-API-Key หรือ ?api_key=
 *
 * Response 200:
 * {
 *   "success": true,
 *   "cycles": [
 *     {
 *       "campaign_id": 2,
 *       "title": "ศิษย์เก่าดีเด่น Q2/2569",
 *       "quarter": "Q2/2569",
 *       "period_start": "2569-04-01",
 *       "period_end": "2569-06-30",
 *       "finalized_at": "2569-07-01T00:00:00Z",
 *       "top10": [ { rank, name, ... }, ... ]
 *     }
 *   ]
 * }
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const apiKey =
    req.headers.get('X-API-Key') ??
    req.headers.get('x-api-key') ??
    searchParams.get('api_key') ??
    '';

  const isValid = await hofResultsService.verifyPublicApiKey(apiKey);
  if (!isValid) {
    return NextResponse.json(
      { success: false, error: 'Invalid or missing API key' },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  try {
    const allHistory = await hofResultsService.getAllCycleHistory();

    // กรอง: คืนเฉพาะรอบที่ finalized แล้ว (public ไม่ต้องเห็นรอบที่ยังเปิดอยู่)
    const finalizedOnly = allHistory.filter((c) => !!c.finalizedAt);

    const cycles = finalizedOnly.map((c) => ({
      campaign_id: c.id,
      title: c.title,
      quarter: c.quarter,
      period_start: c.periodStart,
      period_end: c.periodEnd,
      finalized_at: c.finalizedAt,
      total_votes: c.totalVotes,
      top10: c.top10.map((r) => ({
        rank: r.rank,
        name: r.name,
        avatar_url: r.avatarUrl,
        company: r.company,
        position: r.position,
        generation: r.generation,
        achievement: r.achievement,
        total_votes: r.totalVotes,
      })),
    }));

    return NextResponse.json(
      {
        success: true,
        total_cycles: cycles.length,
        cycles,
        meta: { generated_at: new Date().toISOString() },
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error('[public/hof/history] error:', err);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดภายในระบบ' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
