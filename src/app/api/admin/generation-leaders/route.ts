import { getCurrentUser } from '@/lib/auth';
import { publicErrorMessage } from '@/lib/api-error';
import { leaderService } from '@/modules/member/services/leader.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * หัวหน้ารุ่น (แอดมินเท่านั้น)
 *  GET                      รายชื่อหัวหน้ารุ่นทั้งหมด
 *  POST   { userId }        แต่งตั้ง (รุ่นตามข้อมูลของสมาชิก; รุ่นที่มีหัวหน้าอยู่แล้วจะถูกแทนที่)
 *  DELETE ?userId=          ถอดจากหัวหน้ารุ่น
 */
async function requireAdmin() {
  const user = await getCurrentUser();
  return user && user.role === 'admin' ? user : null;
}

export async function GET() {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json(await leaderService.listLeaders());
  } catch (err) {
    console.error('[API /api/admin/generation-leaders GET] Error:', err);
    return NextResponse.json({ error: publicErrorMessage(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { userId } = await req.json();
    const id = Number(userId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ไม่พบรหัสสมาชิก' }, { status: 400 });
    }
    const result = await leaderService.appoint(id, admin.id);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('[API /api/admin/generation-leaders POST] Error:', err);
    // ข้อความจาก leaderService.appoint เป็นข้อความสำหรับผู้ใช้อยู่แล้ว
    return NextResponse.json({ error: publicErrorMessage(err, 'แต่งตั้งหัวหน้ารุ่นไม่สำเร็จ') }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const id = Number(req.nextUrl.searchParams.get('userId'));
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ไม่พบรหัสสมาชิก' }, { status: 400 });
    }
    const removed = await leaderService.remove(id, admin.id);
    if (!removed) return NextResponse.json({ error: 'สมาชิกคนนี้ไม่ได้เป็นหัวหน้ารุ่น' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API /api/admin/generation-leaders DELETE] Error:', err);
    return NextResponse.json({ error: publicErrorMessage(err) }, { status: 500 });
  }
}
