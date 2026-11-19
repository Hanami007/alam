import { nasCatalogService } from '@/services/nas/catalog.service';
import { publicErrorMessage } from '@/lib/api-error';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const generations = await nasCatalogService.getGenerationNumbers();
    return NextResponse.json({ success: true, generations });
  } catch (err: any) {
    console.error('Error fetching NAS generations:', err);
    return NextResponse.json({ error: publicErrorMessage(err, 'Error fetching generations') }, { status: 500 });
  }
}
