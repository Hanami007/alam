import { getCurrentUser } from '@/lib/auth';
import { galleryDbService } from '@/modules/gallery/services/gallery.service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 1;
    const unlockedGens = await galleryDbService.getUserUnlockedGenerations(userId);

    return NextResponse.json({
      success: true,
      unlockedGenerations: unlockedGens,
      userGeneration: user?.generation || 'รุ่น 25',
    });
  } catch (err: any) {
    console.error('Error fetching unlocked generations:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
