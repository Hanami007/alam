import { NextResponse } from 'next/server';
import { hofResultsService } from '@/modules/hall-of-fame/services/hof-results.service';

// ─── CORS Headers ─────────────────────────────────────────────────────────────
// อนุญาตให้เว็บไซต์ภายนอกเรียก API นี้ได้จากทุก origin
// ถ้าต้องการจำกัด domain ให้เปลี่ยน '*' เป็น 'https://your-website.com'
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.PUBLIC_API_ALLOWED_ORIGIN ?? '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60', // cache 5 นาที
};

// ─── Preflight OPTIONS ────────────────────────────────────────────────────────
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/public/hof/top10
 *
 * ดึง TOP 10 ศิษย์เก่าดีเด่นจากรอบล่าสุดที่ประกาศผลแล้ว
 *
 * Authentication (เลือกหนึ่ง):
 *   Header:      X-API-Key: <your-key>
 *   Query param: ?api_key=<your-key>
 *
 * API Key คือค่าใน:
 *   env: PUBLIC_HOF_API_KEY=...    (ตั้งใน .env)
 *   หรือ system_settings.public_api_key  (ตั้งผ่าน admin panel)
 *
 * Response 200:
 * {
 *   "success": true,
 *   "campaign": {
 *     "id": 2,
 *     "title": "ศิษย์เก่าดีเด่น Q2/2569",
 *     "quarter": "Q2/2569",
 *     "period_start": "2569-04-01",
 *     "period_end": "2569-06-30",
 *     "finalized_at": "2569-07-01T00:00:00Z"
 *   },
 *   "top10": [
 *     {
 *       "rank": 1,
 *       "name": "ชื่อ นามสกุล",
 *       "avatar_url": "https://...",
 *       "company": "บริษัท",
 *       "position": "ตำแหน่ง",
 *       "generation": "รุ่น 28",
 *       "achievement": "ผลงานดีเด่น",
 *       "total_votes": 42
 *     },
 *     ...
 *   ]
 * }
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // ─── API Key Verification ─────────────────────────────────────────────────
  const apiKey =
    req.headers.get('X-API-Key') ??
    req.headers.get('x-api-key') ??
    searchParams.get('api_key') ??
    '';

  const isValid = await hofResultsService.verifyPublicApiKey(apiKey);
  if (!isValid) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid or missing API key. ส่ง X-API-Key header หรือ ?api_key= query parameter',
        docs: 'ติดต่อผู้ดูแลระบบเพื่อขอ API Key',
      },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  // ─── รองรับ campaign_id เฉพาะเจาะจง (optional) ───────────────────────────
  const campaignIdParam = searchParams.get('campaign_id');

  try {
    let top10;
    if (campaignIdParam) {
      const campaignId = parseInt(campaignIdParam, 10);
      if (isNaN(campaignId)) {
        return NextResponse.json(
          { success: false, error: 'campaign_id ต้องเป็นตัวเลข' },
          { status: 400, headers: CORS_HEADERS }
        );
      }
      top10 = await hofResultsService.getTop10ByCampaign(campaignId);
    } else {
      top10 = await hofResultsService.getLatestTop10();
    }

    if (top10.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'ยังไม่มีผลประกาศ TOP 10 ในระบบ',
          hint: 'ต้องรอให้แอดมินปิดรอบและประกาศผลก่อน',
        },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // แยก campaign metadata จาก record แรก
    const first = top10[0];
    const campaign = {
      id: first.campaignId,
      title: first.campaignTitle,
      quarter: first.quarter,
      period_start: first.periodStart,
      period_end: first.periodEnd,
      finalized_at: first.finalizedAt,
    };

    // Format response สำหรับ external use — เฉพาะ field ที่จำเป็น
    const formatted = top10.map((r) => ({
      rank: r.rank,
      name: r.name,
      avatar_url: r.avatarUrl,
      company: r.company,
      position: r.position,
      generation: r.generation,
      achievement: r.achievement,
      total_votes: r.totalVotes,
    }));

    return NextResponse.json(
      {
        success: true,
        campaign,
        top10: formatted,
        meta: {
          total: formatted.length,
          generated_at: new Date().toISOString(),
        },
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error('[public/hof/top10] error:', err);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดภายในระบบ' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
