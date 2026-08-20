import { hasUnlockedPhoto, tagUserInPhoto } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { mediaAssetId, taggedUserId, currentUserId } = await req.json();

    if (!mediaAssetId || !taggedUserId || !currentUserId) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });
    }

    const unlocked = await hasUnlockedPhoto(Number(currentUserId), Number(mediaAssetId));
    if (!unlocked) {
      return NextResponse.json(
        { error: 'ต้องตอบคำถามปลดล็อกรูปก่อนถึงจะแท็กได้' },
        { status: 403 }
      );
    }

    const result = await tagUserInPhoto(
      Number(mediaAssetId),
      Number(taggedUserId),
      Number(currentUserId)
    );

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('Gallery tag error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}