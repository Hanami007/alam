import { getCurrentUser } from '@/lib/auth';
import { hofResultsService } from '@/modules/hall-of-fame/services/hof-results.service';
import { NextResponse } from 'next/server';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

/** GET /api/admin/public-api-key — ดึงค่า public_api_key ปัจจุบัน */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const apiKey = await hofResultsService.getPublicApiKey();
  return NextResponse.json({ apiKey });
}

/** POST /api/admin/public-api-key — สร้างคีย์ใหม่แบบสุ่ม (คีย์เก่าใช้ไม่ได้ทันที) */
export async function POST() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const apiKey = await hofResultsService.regeneratePublicApiKey();
  return NextResponse.json({ success: true, apiKey });
}
