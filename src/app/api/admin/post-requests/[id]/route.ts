// วางไฟล์นี้ที่ src/app/api/admin/post-requests/[id]/route.ts
import { getCurrentUser } from '@/lib/auth';
import { feedDbService } from '@/modules/feed/services/feed.service';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const postId = Number(id);
  const { action } = await req.json();

  if (action === 'approve') {
    // ใช้ user.id จาก session เป็นผู้อนุมัติเสมอ ไม่รับ adminId จาก client
    const result = await feedDbService.approvePostRequest(postId, user.id);
    return NextResponse.json({ success: true, result });
  }
  if (action === 'reject') {
    const result = await feedDbService.rejectPostRequest(postId);
    return NextResponse.json({ success: true, result });
  }
  return NextResponse.json({ error: 'action ไม่ถูกต้อง' }, { status: 400 });
}