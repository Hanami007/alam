import { getCurrentUser } from '@/lib/auth';
import { publicErrorMessage } from '@/lib/api-error';
import { galleryDbService } from '@/modules/gallery/services/gallery.service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }
    const unlockedGens = await galleryDbService.getUserUnlockedGenerations(user.id);

    return NextResponse.json({
      success: true,
      unlockedGenerations: unlockedGens,
      userGeneration: user.generation || null,
    });
  } catch (err: any) {
    console.error('Error fetching unlocked generations:', err);
    return NextResponse.json({ error: publicErrorMessage(err) }, { status: 500 });
  }
}
