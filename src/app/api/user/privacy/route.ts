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
    const body = await req.json();
    const userId = body.userId ? Number(body.userId) : user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const { showHometownOnMap = false, showWorkplaceOnMap = false } = body;

    const result = await userDbService.updatePrivacySettings(userId, {
      showHometownOnMap: Boolean(showHometownOnMap),
      showWorkplaceOnMap: Boolean(showWorkplaceOnMap),
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('[API /api/user/privacy] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
