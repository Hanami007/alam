import { getCurrentUser } from '@/lib/auth';
import { publicErrorMessage } from '@/lib/api-error';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ user: user || null });
  } catch (err: any) {
    return NextResponse.json({ error: publicErrorMessage(err), user: null }, { status: 500 });
  }
}
