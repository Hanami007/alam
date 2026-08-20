import { recordPhotoUnlock, pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userId, assetId, answer } = await req.json();

    if (!userId || !assetId) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });
    }

    // ดึง question จากรูปภาพ (ถ้ามีข้อมูลเดิมใน photo_view_verifications แล้ว)
    const { rows: existingRows } = await pool.query(
      `SELECT id FROM photo_view_verifications WHERE asset_id = $1 AND user_id = $2 AND is_passed = true LIMIT 1`,
      [assetId, userId]
    );

    if (existingRows.length > 0) {
      // ปลดล็อกแล้ว — ไม่ต้องบันทึกซ้ำ แต่บอกว่า success
      return NextResponse.json({ success: true, alreadyUnlocked: true, pointsEarned: 0 });
    }

    // ดึง question จาก media asset (ผ่าน photo_view_verifications ที่ admin กรอกไว้ หรือ unlock_question จาก getGalleryItems)
    const { rows: assetRows } = await pool.query(
      `SELECT ma.caption,
              COALESCE(
                (SELECT pvv.question FROM photo_view_verifications pvv WHERE pvv.asset_id = ma.id LIMIT 1),
                'ตอบคำถามเกี่ยวกับรุ่นนี้เพื่อปลดล็อก'
              ) AS question
       FROM media_assets ma WHERE ma.id = $1`,
      [assetId]
    );

    const question = assetRows[0]?.question ?? 'ตอบคำถามเกี่ยวกับรุ่นนี้เพื่อปลดล็อก';

    // ระบบ honor: ตอบอะไรก็ได้ — บันทึกคำตอบไว้ใน DB เสมอ (isPassed = true)
    // คำตอบของผู้ใช้ถูกเก็บเป็น question field เพื่อให้ admin review ภายหลัง
    const savedQuestion = answer?.trim()
      ? `[คำตอบ: ${answer.trim()}] ${question}`
      : question;

    const result = await recordPhotoUnlock(assetId, Number(userId), savedQuestion, true);

    return NextResponse.json({
      success: true,
      pointsEarned: result.pointsEarned,
      alreadyUnlocked: false,
    });
  } catch (err: any) {
    console.error('Gallery unlock error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}