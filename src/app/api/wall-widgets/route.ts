import { adminDbService } from '@/modules/admin/services/admin.service';
import { hofDbService } from '@/modules/hall-of-fame/services/hof.service';
import { NextResponse } from 'next/server';

/** GET /api/wall-widgets — ข้อมูลสาธารณะสำหรับวิดเจ็ตหน้าวอลล์ (เซียมซี/วันเกิด/อันดับกิจกรรม) */
export async function GET() {
  const [fortunes, birthdays, hofCandidates] = await Promise.all([
    adminDbService.getWallFortunes(),
    adminDbService.getTodaysBirthdays(),
    hofDbService.getCandidates(),
  ]);

  // อันดับกิจกรรม = Top 3 ศิษย์เก่าดีเด่น (Hall of Fame) เรียงตามคะแนนโหวตสะสมจริง
  const leaderboard = hofCandidates.slice(0, 3).map((c) => ({
    id: c.id,
    name: c.name,
    generation: c.generation || null,
    points: c.hofPoints,
    avatar: c.name ? c.name.trim().slice(0, 2) : null,
  }));

  return NextResponse.json({ fortunes, birthdays, leaderboard });
}
