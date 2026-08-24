import { alumniAggregator } from '@/services/aggregator/alumni.aggregator';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || undefined;
    const generation = searchParams.get('generation') || undefined;
    const province = searchParams.get('province') || undefined;
    const careerType = searchParams.get('careerType') || undefined;

    const list = await alumniAggregator.getUnifiedAlumniList({
      query,
      generation,
      province,
      careerType,
    });

    return NextResponse.json(list);
  } catch (err: any) {
    console.error('[API /api/yearbook] Error:', err);
    return NextResponse.json({ error: err.message || 'ไม่สามารถโหลดหนังสือรุ่นได้' }, { status: 500 });
  }
}
