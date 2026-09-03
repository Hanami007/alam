import { getCurrentUser } from '@/lib/auth';
import { getActivityLog } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedId = searchParams.get('id');
    const targetUserId = requestedId ? Number(requestedId) : user.id;

    // หากไม่ใช่เจ้าของโปรไฟล์ ไม่อนุญาตให้ดูประวัติกิจกรรมการคอมเมนต์และการโหวตคะแนน
    if (targetUserId !== user.id) {
      return NextResponse.json({
        isPrivate: true,
        message: 'ประวัติกิจกรรมเป็นข้อมูลส่วนบุคคล เฉพาะเจ้าของบัญชีเท่านั้นที่สามารถมองเห็นได้',
        activities: [],
      });
    }

    const logs = await getActivityLog(user.id);
    return NextResponse.json(logs);
  } catch (err: any) {
    console.error('[API /api/user/activity] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
