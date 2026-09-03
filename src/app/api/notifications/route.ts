import { getCurrentUser } from '@/lib/auth';
import { getUserNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(user.id, 25),
      getUnreadNotificationCount(user.id),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (err: any) {
    console.error('[API /api/notifications] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    if (body.all) {
      await markAllNotificationsAsRead(user.id);
      return NextResponse.json({ success: true });
    }

    if (body.notifId) {
      const updated = await markNotificationAsRead(Number(body.notifId), user.id);
      return NextResponse.json({ success: true, notification: updated });
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  } catch (err: any) {
    console.error('[API POST /api/notifications] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
