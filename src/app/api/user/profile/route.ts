import { getCurrentUser } from '@/lib/auth';
import { publicErrorMessage } from '@/lib/api-error';
import { redactPrivateFields, userDbService } from '@/modules/profile/services/user.service';
import { alumniAggregator } from '@/services/aggregator/alumni.aggregator';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const requestedId = searchParams.get('id');

    const targetUserId = requestedId ? parseInt(requestedId, 10) : user?.id;
    if (!targetUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await userDbService.getUserProfile(targetUserId);
    let unified = null;
    try {
      unified = await alumniAggregator.getUnifiedProfileById(targetUserId);
    } catch (err) {
      // ข้อมูลจากระบบมหาวิทยาลัยเป็นข้อมูลเสริม ไม่ควรทำให้โปรไฟล์ local ล่มทั้งชุด
      console.error('[API /api/user/profile] Alumni aggregator unavailable:', err);
    }
    const isOwner = user ? user.id === targetUserId : false;

    const merged = {
      ...unified,
      ...profile,
      id: targetUserId,
      role: profile?.role || (isOwner ? user?.role : 'alumni'),
      isOwner,
    };

    // คนอื่นเห็นเฉพาะฟิลด์ที่เจ้าของเปิดไว้ (เจ้าของและแอดมินเห็นครบ)
    // ไม่พบในระบบ local = ไม่มีการตั้งค่า → ปิดทั้งหมด
    const canSeeAll = isOwner || user?.role === 'admin';
    const body = canSeeAll
      ? merged
      : redactPrivateFields(merged, {
          showEmail: Boolean(profile?.showEmail),
          showBirthDate: Boolean(profile?.showBirthDate),
          showStudentId: Boolean(profile?.showStudentId),
          showFacebook: Boolean(profile?.showFacebook),
          showLineId: Boolean(profile?.showLineId),
        });

    return NextResponse.json(body);
  } catch (err: any) {
    console.error('[API /api/user/profile] Error:', err);
    return NextResponse.json({ error: publicErrorMessage(err, 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้') }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const userId = user.id;

    await userDbService.updateProfile(userId, body);

    return NextResponse.json({ success: true, userId });
  } catch (err: any) {
    console.error('[API PUT /api/user/profile] Error:', err);
    // ข้อมูลผิดรูปแบบจาก updateProfile (เช่น สถานะ/ปีจบ) = 400 พร้อมข้อความ ที่เหลือซ่อนรายละเอียด
    const isValidationError = /ไม่ถูกต้อง|ต้องเป็น/.test(err?.message || '');
    return NextResponse.json(
      { error: isValidationError ? err.message : publicErrorMessage(err) },
      { status: isValidationError ? 400 : 500 }
    );
  }
}
