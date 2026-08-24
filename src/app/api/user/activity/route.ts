import { getCurrentUser } from '@/lib/auth';
import { userDbService } from '@/services/db/user.service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logs = await userDbService.getActivityLogs(user.id);
    return NextResponse.json(logs);
  } catch (err: any) {
    console.error('[API /api/user/activity] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
