import { deleteSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    if (sessionId) {
      await deleteSession(sessionId);
    }

    cookieStore.delete('session_id');

    return NextResponse.json({ success: true, message: 'ออกจากระบบสำเร็จ' });
  } catch (err: any) {
    console.error('Logout error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
