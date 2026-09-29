import { NextResponse } from 'next/server';
import { hofResultsService } from '@/modules/hall-of-fame/services/hof-results.service';

/**
 * GET /api/hof/results/history
 * ประวัติผล TOP 10 ทุกรอบ (ต้องล็อกอิน — ใช้ session ปกติ)
 * ใช้โดย /hall-of-fame/results หน้าภายใน app
 */
export async function GET() {
  try {
    const allHistory = await hofResultsService.getAllCycleHistory();

    // คืนเฉพาะรอบที่ finalized แล้ว (public view)
    const cycles = allHistory
      .filter((c) => !!c.finalizedAt)
      .map((c) => ({
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

    return NextResponse.json({ success: true, cycles });
  } catch (err) {
    console.error('[hof/results/history] error:', err);
    return NextResponse.json({ success: false, error: 'โหลดข้อมูลไม่สำเร็จ' }, { status: 500 });
  }
}
