import { getCurrentUser } from '@/lib/auth';
import { publicErrorMessage } from '@/lib/api-error';
import { galleryAggregator } from '@/services/aggregator/gallery.aggregator';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const items = await galleryAggregator.getUnifiedGallery(user?.id);
    return NextResponse.json(items);
  } catch (err: any) {
    console.error('[API /api/gallery] Error:', err);
    return NextResponse.json({ error: publicErrorMessage(err, 'ไม่สามารถโหลดคลังภาพได้') }, { status: 500 });
  }
}
