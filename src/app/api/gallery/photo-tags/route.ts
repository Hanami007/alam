import { getCurrentUser } from '@/lib/auth';
import { publicErrorMessage } from '@/lib/api-error';
import { NasTagError, nasTagService, parsePhotoPath } from '@/modules/gallery/services/nas-tag.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * แท็กคนในรูปคลังภาพเก่า (NAS)
 *  GET    ?path=                          แท็กของรูป
 *  POST   { path, userId? }               แท็ก (ไม่ส่ง userId = แท็กตัวเอง "นี่คือฉัน")
 *  PATCH  { id, action: accept|decline }  คนที่ถูกแท็กตอบรับ/ปฏิเสธ
 *  DELETE ?id=                            ลบแท็ก
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    const path = req.nextUrl.searchParams.get('path') ?? '';
    const parsed = parsePhotoPath(path);
    if (!parsed) return NextResponse.json({ error: 'รูปภาพไม่ถูกต้อง' }, { status: 400 });

    const [tags, canTag] = await Promise.all([
      nasTagService.listForPhoto(path, user),
      nasTagService.canTag(user.id, user.role, parsed.generation),
    ]);
    return NextResponse.json({ tags, canTag });
  } catch (err) {
    console.error('[API /api/gallery/photo-tags GET] Error:', err);
    return NextResponse.json({ error: publicErrorMessage(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    const { path, userId } = await req.json();
    const target = userId === undefined || userId === null ? user.id : Number(userId);
    if (!Number.isInteger(target) || target <= 0) {
      return NextResponse.json({ error: 'ไม่พบสมาชิกที่ต้องการแท็ก' }, { status: 400 });
    }
    const result = await nasTagService.addTag(String(path ?? ''), target, user);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    if (err instanceof NasTagError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error('[API /api/gallery/photo-tags POST] Error:', err);
    return NextResponse.json({ error: publicErrorMessage(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    const { id, action } = await req.json();
    if (!Number.isInteger(Number(id)) || (action !== 'accept' && action !== 'decline')) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }
    const ok = await nasTagService.respond(Number(id), user.id, action === 'accept');
    if (!ok) return NextResponse.json({ error: 'ไม่พบแท็กที่รอการยืนยันของคุณ' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API /api/gallery/photo-tags PATCH] Error:', err);
    return NextResponse.json({ error: publicErrorMessage(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    const id = Number(req.nextUrl.searchParams.get('id'));
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    const ok = await nasTagService.remove(id, user);
    if (!ok) return NextResponse.json({ error: 'ลบแท็กนี้ไม่ได้' }, { status: 403 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API /api/gallery/photo-tags DELETE] Error:', err);
    return NextResponse.json({ error: publicErrorMessage(err) }, { status: 500 });
  }
}
