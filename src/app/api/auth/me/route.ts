import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ user: user || null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, user: null }, { status: 500 });
  }
}
