import { getCurrentUser } from '@/lib/auth';
import { adminDbService } from '@/modules/admin/services/admin.service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, decision, remark } = await req.json();
    if (!userId || !['approved', 'rejected'].includes(decision)) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง' }, { status: 400 });
    }

    const result = await adminDbService.decideUserVerification(
      Number(userId),
      user.id,
      decision,
      remark
    );

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('[API /api/admin/verify] Error:', err);
    return NextResponse.json({ error: err.message || 'Error processing verification' }, { status: 500 });
  }
}
