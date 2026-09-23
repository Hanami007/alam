import { getCurrentUser } from '@/lib/auth';
import { adminDbService } from '@/modules/admin/services/admin.service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const members = await adminDbService.getAllUsers();
    return NextResponse.json(members);
  } catch (err: any) {
    console.error('[API /api/admin/users] Error:', err);
    return NextResponse.json({ error: err.message || 'Error loading members' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = Number(request.nextUrl.searchParams.get('id'));
    if (!userId) {
      return NextResponse.json({ error: 'ไม่พบรหัสสมาชิก' }, { status: 400 });
    }
    if (userId === user.id) {
      return NextResponse.json({ error: 'ไม่สามารถลบบัญชีของตนเองได้' }, { status: 400 });
    }

    const result = await adminDbService.deleteUser(userId);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'ลบสมาชิกไม่สำเร็จ' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API /api/admin/users] DELETE Error:', err);
    return NextResponse.json({ error: err.message || 'Error deleting member' }, { status: 500 });
  }
}
