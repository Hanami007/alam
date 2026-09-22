import { galleryDbService } from '@/modules/gallery/services/gallery.service';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const actor = await getCurrentUser();
    if (!actor) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนแท็กเพื่อน' }, { status: 401 });
    }

    const { photoId, mediaAssetId, taggedUserId, userId } = await req.json();
    // คนถูกแท็ก (taggedUserId) เป็นคนอื่นได้ตามฟีเจอร์ปกติ — แต่ "ผู้แท็ก" (taggedBy) ต้องเป็น
    // session ปัจจุบันเท่านั้น ห้ามให้ client เลือกเองว่าจะให้ระบบบันทึกว่าใครเป็นคนแท็ก
    const targetUserId = Number(taggedUserId || userId);
    const assetId = Number(String(photoId || mediaAssetId || '1').replace('photo-', '')) || 1;

    if (!targetUserId) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });
    }

    const result = await galleryDbService.tagUserInPhoto(assetId, targetUserId, actor.id);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('Gallery tag error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const actor = await getCurrentUser();
    if (!actor) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนลบแท็ก' }, { status: 401 });
    }

    const { photoId, mediaAssetId, taggedUserId, userId } = await req.json();
    const targetUserId = Number(taggedUserId || userId);
    const assetId = Number(String(photoId || mediaAssetId || '1').replace('photo-', '')) || 1;

    if (!targetUserId) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });
    }

    // อนุญาตให้ลบแท็กได้เฉพาะเจ้าของแท็ก (ลบแท็กตัวเอง) หรือแอดมินเท่านั้น
    if (targetUserId !== actor.id && actor.role !== 'admin') {
      return NextResponse.json(
        { error: 'คุณลบแท็กของคนอื่นไม่ได้ (ลบได้เฉพาะแท็กของตัวเอง)' },
        { status: 403 }
      );
    }

    const result = await galleryDbService.removeTag(assetId, targetUserId);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('Gallery untag error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}