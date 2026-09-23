import { adminDbService } from '@/modules/admin/services/admin.service';
import { hofDbService } from '@/modules/hall-of-fame/services/hof.service';
import { NextResponse } from 'next/server';

/** GET /api/wall-widgets — ข้อมูลสาธารณะสำหรับวิดเจ็ตหน้าวอลล์ (เซียมซี/วันเกิด/อันดับกิจกรรม) */
export async function GET() {
  try {
    // แยก Promise.allSettled แทน Promise.all — ถ้าคอลัมน์/ตารางใดยังไม่มี (เช่น migration
    // ที่เพิ่งเพิ่มยังไม่ได้รันบนเซิร์ฟเวอร์จริง) วิดเจ็ตอื่นที่ยังใช้งานได้จะไม่พังไปด้วย
    const [fortunesRes, birthdaysRes, hofRes] = await Promise.allSettled([
      adminDbService.getWallFortunes(),
      adminDbService.getTodaysBirthdays(),
      hofDbService.getCandidates(),
    ]);

    if (birthdaysRes.status === 'rejected') {
      console.error('[API /api/wall-widgets] getTodaysBirthdays failed:', birthdaysRes.reason);
    }
    if (fortunesRes.status === 'rejected') {
      console.error('[API /api/wall-widgets] getWallFortunes failed:', fortunesRes.reason);
    }

    const hofCandidates = hofRes.status === 'fulfilled' ? hofRes.value : [];
    // อันดับกิจกรรม = Top 3 ศิษย์เก่าดีเด่น (Hall of Fame) เรียงตามคะแนนโหวตสะสมจริง
    const leaderboard = hofCandidates.slice(0, 3).map((c) => ({
      id: c.id,
      name: c.name,
      generation: c.generation || null,
      points: c.hofPoints,
      avatar: c.name ? c.name.trim().slice(0, 2) : null,
    }));

    return NextResponse.json({
      fortunes: fortunesRes.status === 'fulfilled' ? fortunesRes.value : [],
      birthdays: birthdaysRes.status === 'fulfilled' ? birthdaysRes.value : [],
      leaderboard,
    });
  } catch (err: any) {
    console.error('[API /api/wall-widgets] Error:', err);
    return NextResponse.json({ fortunes: [], birthdays: [], leaderboard: [] }, { status: 500 });
  }
}
