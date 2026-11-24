import { getCurrentUser } from '@/lib/auth';
import { publicErrorMessage } from '@/lib/api-error';
import { nasTagService } from '@/modules/gallery/services/nas-tag.service';
import { NextRequest, NextResponse } from 'next/server';

/** GET /api/gallery/photo-tags/members?q= — ค้นหาสมาชิกเพื่อแท็กในรูป (ชื่อ ชื่อเล่น หรือรหัสนักศึกษา) */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    const q = (req.nextUrl.searchParams.get('q') ?? '').slice(0, 50);
    return NextResponse.json(await nasTagService.searchMembers(q));
  } catch (err) {
    console.error('[API /api/gallery/photo-tags/members] Error:', err);
    return NextResponse.json({ error: publicErrorMessage(err) }, { status: 500 });
  }
}
