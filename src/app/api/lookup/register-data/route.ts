import { lookupDbService } from '@/services/db/lookup.service';
import { publicErrorMessage } from '@/lib/api-error';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [generations, provinces, careerTypes] = await Promise.all([
      lookupDbService.getGenerations(),
      lookupDbService.getAllProvinces(),
      lookupDbService.getCareerTypes(),
    ]);

    return NextResponse.json({
      generations,
      provinces,
      careerTypes,
    });
  } catch (err: any) {
    console.error('[API /api/lookup/register-data] Error:', err);
    return NextResponse.json(
      { error: publicErrorMessage(err, 'ไม่สามารถโหลดข้อมูลตัวเลือกได้') },
      { status: 500 }
    );
  }
}
