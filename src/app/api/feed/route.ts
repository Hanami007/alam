import { getCurrentUser } from '@/lib/auth';
import { feedDbService } from '@/modules/feed/services/feed.service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const posts = await feedDbService.getPosts(user?.id);
    return NextResponse.json(posts);
  } catch (err: any) {
    console.error('[API /api/feed] Error:', err);
    return NextResponse.json({ error: err.message || 'ไม่สามารถโหลดฟีดได้' }, { status: 500 });
  }
}
