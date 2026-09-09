import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserTaggedPhotos, getUserUnlockedPhotos } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const searchParams = req.nextUrl.searchParams;
    const requestedUserId = searchParams.get('userId');

    const targetUserId = requestedUserId ? parseInt(requestedUserId, 10) : user?.id;
    if (!targetUserId || isNaN(targetUserId)) {
      return NextResponse.json({ taggedPhotos: [], unlockedPhotos: [] });
    }

    const [taggedPhotos, unlockedPhotos] = await Promise.all([
      getUserTaggedPhotos(targetUserId),
      getUserUnlockedPhotos(targetUserId),
    ]);

    return NextResponse.json({
      taggedPhotos,
      unlockedPhotos,
    });
  } catch (err: any) {
    console.error('Error fetching user photos:', err);
    return NextResponse.json({ taggedPhotos: [], unlockedPhotos: [] });
  }
}
