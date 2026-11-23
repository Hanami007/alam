import { getCurrentUser } from '@/lib/auth';
import { publicErrorMessage } from '@/lib/api-error';
import {
  PRIVATE_FIELD_FLAGS,
  type PrivacyFlag,
  type PrivacySettings,
  userDbService,
} from '@/modules/profile/services/user.service';
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
    // อัปเดตเฉพาะ flag ที่ส่งมา (เช่น { showEmail: true }) ไม่แตะ flag อื่น
    const settings: PrivacySettings = {};
    for (const key of Object.keys(PRIVATE_FIELD_FLAGS) as PrivacyFlag[]) {
      if (body[key] !== undefined) settings[key] = Boolean(body[key]);
    }

    const result = await userDbService.updatePrivacySettings(user.id, settings);

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('[API /api/user/privacy] Error:', err);
    return NextResponse.json({ error: publicErrorMessage(err) }, { status: 500 });
  }
}
