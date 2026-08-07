// วางไฟล์นี้ที่ src/app/api/feed/request/route.ts
import { createPostRequest } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { requestedBy, title, content, category } = await req.json();
  if (!requestedBy || !title || !content) {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });
  }
  const post = await createPostRequest(requestedBy, title, content, category ?? '');
  return NextResponse.json({ success: true, post });
}