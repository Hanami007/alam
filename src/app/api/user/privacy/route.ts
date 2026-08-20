import { updateMapPrivacy, updateUserProfile } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, showHometownOnMap, showWorkplaceOnMap } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId ไม่ถูกต้อง' }, { status: 400 });
    }

    const result = await updateMapPrivacy(Number(userId), {
      showHometownOnMap: showHometownOnMap ?? undefined,
      showWorkplaceOnMap: showWorkplaceOnMap ?? undefined,
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
