import { alumniAggregator } from '@/services/aggregator/alumni.aggregator';
import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = await alumniAggregator.getUnifiedProfileById(id);

    if (!profile) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลศิษย์เก่า' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (err: any) {
    console.error('[API /api/alumni/[id]] Error:', err);
    return NextResponse.json({ error: err.message || 'ไม่สามารถโหลดข้อมูลศิษย์เก่าได้' }, { status: 500 });
  }
}
