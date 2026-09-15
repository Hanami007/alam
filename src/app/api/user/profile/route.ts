import { getCurrentUser } from '@/lib/auth';
import { userDbService } from '@/services/db/user.service';
import { alumniAggregator } from '@/services/aggregator/alumni.aggregator';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const requestedId = searchParams.get('id');

    const targetUserId = requestedId ? parseInt(requestedId, 10) : user?.id;
    if (!targetUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await userDbService.getUserProfile(targetUserId);
    const unified = await alumniAggregator.getUnifiedProfileById(targetUserId);
    const isOwner = user ? user.id === targetUserId : false;

    return NextResponse.json({
      ...unified,
      ...profile,
      id: targetUserId,
      role: profile?.role || (isOwner ? user?.role : 'alumni'),
      isOwner,
    });
  } catch (err: any) {
    console.error('[API /api/user/profile] Error:', err);
    return NextResponse.json({ error: err.message || 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const userId = user.id;

    await userDbService.updateProfile(userId, body);

    return NextResponse.json({ success: true, userId });
  } catch (err: any) {
    console.error('[API PUT /api/user/profile] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
