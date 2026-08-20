// วางไฟล์นี้ที่ src/app/api/admin/post-requests/[id]/route.ts
import { approvePostRequest, rejectPostRequest } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postId = Number(id);
  const { action, adminId } = await req.json();

  if (action === 'approve') {
    const result = await approvePostRequest(postId, adminId);
    return NextResponse.json({ success: true, result });
  }
  if (action === 'reject') {
    const result = await rejectPostRequest(postId);
    return NextResponse.json({ success: true, result });
  }
  return NextResponse.json({ error: 'action ไม่ถูกต้อง' }, { status: 400 });
}