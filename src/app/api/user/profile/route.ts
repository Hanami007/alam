import { getCurrentUser } from '@/lib/auth';
import { userDbService } from '@/services/db/user.service';
import { alumniAggregator } from '@/services/aggregator/alumni.aggregator';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 2;

    const profile = await userDbService.getUserProfile(userId);
    const unified = await alumniAggregator.getUnifiedProfileById(userId);

    return NextResponse.json({
      ...unified,
      ...profile,
      id: userId,
    });
  } catch (err: any) {
    console.error('[API /api/user/profile] Error:', err);
    return NextResponse.json({ error: err.message || 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const userId = user?.id || body.userId || 2;

    await userDbService.updateProfile(userId, body);

    return NextResponse.json({ success: true, userId });
  } catch (err: any) {
    console.error('[API PUT /api/user/profile] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
