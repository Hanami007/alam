import { getGenerations, getAllProvinces, getCareerTypes } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [generations, provinces, careerTypes] = await Promise.all([
      getGenerations(),
      getAllProvinces(),
      getCareerTypes(),
    ]);

    return NextResponse.json({
      generations,
      provinces,
      careerTypes,
    });
  } catch (err: any) {
    console.error('[API /api/lookup/register-data] Error:', err);
    return NextResponse.json(
      { error: err.message || 'ไม่สามารถโหลดข้อมูลตัวเลือกได้' },
      { status: 500 }
    );
  }
}
