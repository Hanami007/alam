import { feedDbService } from '@/modules/feed/services/feed.service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { postId, userId } = await req.json();
    if (!postId || !userId) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }
    const result = await feedDbService.toggleLike(Number(postId), Number(userId));
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
