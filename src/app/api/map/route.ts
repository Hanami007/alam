import { mapDbService } from '@/services/db/map.service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [hometownData, workplaceData] = await Promise.all([
      mapDbService.getHometownDistribution(),
      mapDbService.getWorkplaceDistribution(),
    ]);

    return NextResponse.json({
      hometownData,
      workplaceData,
    });
  } catch (err: any) {
    console.error('[API /api/map] Error:', err);
    return NextResponse.json({ error: err.message || 'ไม่สามารถโหลดข้อมูลแผนที่ได้' }, { status: 500 });
  }
}
