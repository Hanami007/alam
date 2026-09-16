import { getCurrentUser } from '@/lib/auth';
import { adminDbService } from '@/modules/admin/services/admin.service';
import { NextResponse } from 'next/server';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

/** GET /api/admin/keywords — ดึงรายการคำต้องห้ามทั้งหมด */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const keywords = await adminDbService.getBannedKeywords();
  return NextResponse.json({ keywords });
}

/** POST /api/admin/keywords — เพิ่มคำต้องห้ามใหม่ */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const keyword = (body.keyword || '').trim();

  if (!keyword) {
    return NextResponse.json(
      { success: false, error: 'กรุณาระบุคำที่ต้องการบล็อก' },
      { status: 400 }
    );
  }

  if (keyword.length < 2) {
    return NextResponse.json(
      { success: false, error: 'คำต้องมีความยาวอย่างน้อย 2 ตัวอักษร' },
      { status: 400 }
    );
  }

  const result = await adminDbService.addBannedKeyword(keyword, admin.id);
  if (!result) {
    return NextResponse.json(
      { success: false, error: 'คำนี้มีอยู่ในรายการแล้ว' },
      { status: 409 }
    );
  }

  return NextResponse.json({ success: true, keyword: result });
}

/** DELETE /api/admin/keywords?id=<id> — ลบคำต้องห้าม */
export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'ระบุ id ไม่ถูกต้อง' },
      { status: 400 }
    );
  }

  const deleted = await adminDbService.removeBannedKeyword(id);
  if (!deleted) {
    return NextResponse.json(
      { success: false, error: 'ไม่พบรายการที่ต้องการลบ' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
