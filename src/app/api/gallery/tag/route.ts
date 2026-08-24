import { galleryDbService } from '@/services/db/gallery.service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { photoId, mediaAssetId, taggedUserId, userId } = await req.json();
    const targetUserId = Number(taggedUserId || userId);
    const assetId = Number(String(photoId || mediaAssetId || '1').replace('photo-', '')) || 1;

    if (!targetUserId) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });
    }

    const result = await galleryDbService.tagUserInPhoto(assetId, targetUserId);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('Gallery tag error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { photoId, mediaAssetId, taggedUserId, userId } = await req.json();
    const targetUserId = Number(taggedUserId || userId);
    const assetId = Number(String(photoId || mediaAssetId || '1').replace('photo-', '')) || 1;

    if (!targetUserId) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });
    }

    const result = await galleryDbService.removeTag(assetId, targetUserId);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('Gallery untag error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}