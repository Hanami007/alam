import { getCurrentUser } from '@/lib/auth';
import { userDbService } from '@/services/db/user.service';
import { alumniAggregator } from '@/services/aggregator/alumni.aggregator';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await userDbService.getUserProfile(user.id);
    const unified = await alumniAggregator.getUnifiedProfileById(user.id);

    return NextResponse.json({
      ...profile,
      ...unified,
      id: user.id,
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
    await userDbService.updateProfile(user.id, body);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API PUT /api/user/profile] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
