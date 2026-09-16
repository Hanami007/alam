import { feedDbService } from '@/modules/feed/services/feed.service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { postId, userId, content } = await req.json();
    if (!postId || !userId || !content?.trim()) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }
    const comment = await feedDbService.addComment(Number(postId), Number(userId), content.trim());
    return NextResponse.json({ success: true, comment, pointsAwarded: 1 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
