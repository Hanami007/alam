import { getCurrentUser } from '@/lib/auth';
import { userDbService } from '@/modules/profile/services/user.service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  return handlePrivacyUpdate(req);
}

export async function PUT(req: Request) {
  return handlePrivacyUpdate(req);
}

async function handlePrivacyUpdate(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }
    const body = await req.json();
    // ใช้ user.id จาก session เสมอ — ห้ามเชื่อ userId ที่ client ส่งมา (กันแก้ privacy ของคนอื่น)
    const { showHometownOnMap = false, showWorkplaceOnMap = false, showContactOnMap = false } = body;

    const result = await userDbService.updatePrivacySettings(user.id, {
      showHometownOnMap: Boolean(showHometownOnMap),
      showWorkplaceOnMap: Boolean(showWorkplaceOnMap),
      showContactOnMap: Boolean(showContactOnMap),
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('[API /api/user/privacy] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
