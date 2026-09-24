import { nasCatalogService } from '@/services/nas/catalog.service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const generations = await nasCatalogService.getGenerationNumbers();
    return NextResponse.json({ success: true, generations });
  } catch (err: any) {
    console.error('Error fetching NAS generations:', err);
    return NextResponse.json({ error: err.message || 'Error fetching generations' }, { status: 500 });
  }
}
