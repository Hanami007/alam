import { mapDbService } from '@/modules/map/services/map.service';
import { publicErrorMessage } from '@/lib/api-error';
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
    return NextResponse.json({ error: publicErrorMessage(err, 'ไม่สามารถโหลดข้อมูลแผนที่ได้') }, { status: 500 });
  }
}
