import { getCurrentUser } from '@/lib/auth';
import { adminDbService } from '@/modules/admin/services/admin.service';
import { NextRequest, NextResponse } from 'next/server';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

/**
 * GET /api/admin/wall-widgets — ดึงข้อความเซียมซีสำหรับหน้าจัดการของแอดมิน
 * (วันเกิดและอันดับกิจกรรมไม่ได้จัดการที่นี่แล้ว เพราะดึงจากข้อมูลจริง — birth_date ของสมาชิก
 * และ Top 3 Hall of Fame ตามลำดับ)
 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const fortunes = await adminDbService.getWallFortunes();
  return NextResponse.json({ fortunes });
}

/** POST /api/admin/wall-widgets — เพิ่มข้อความเซียมซีใหม่ (type: 'fortune') */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { type } = body;

  try {
    if (type === 'fortune') {
      const message = (body.message || '').trim();
      if (!message) {
        return NextResponse.json({ error: 'กรุณาระบุข้อความเซียมซี' }, { status: 400 });
      }
      const created = await adminDbService.addWallFortune(message);
      return NextResponse.json({ success: true, data: created });
    }

    return NextResponse.json({ error: 'ระบุ type ไม่ถูกต้อง' }, { status: 400 });
  } catch (err: any) {
    console.error('[API /api/admin/wall-widgets POST] Error:', err);
    return NextResponse.json({ error: err.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

/** DELETE /api/admin/wall-widgets?type=fortune&id=<id> — ลบข้อความเซียมซี */
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get('type');
  const id = Number(req.nextUrl.searchParams.get('id'));
  if (!id) {
    return NextResponse.json({ error: 'ระบุ id ไม่ถูกต้อง' }, { status: 400 });
  }

  try {
    if (type !== 'fortune') {
      return NextResponse.json({ error: 'ระบุ type ไม่ถูกต้อง' }, { status: 400 });
    }
    const deleted = await adminDbService.removeWallFortune(id);
    if (!deleted) {
      return NextResponse.json({ error: 'ไม่พบรายการที่ต้องการลบ' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API /api/admin/wall-widgets DELETE] Error:', err);
    return NextResponse.json({ error: err.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
