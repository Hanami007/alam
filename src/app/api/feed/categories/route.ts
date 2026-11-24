import { feedDbService } from '@/modules/feed/services/feed.service';
import { publicErrorMessage } from '@/lib/api-error';
import { NextResponse } from 'next/server';

/** GET /api/feed/categories — หมวดหมู่ที่มีโพสต์เผยแพร่อยู่ + จำนวนโพสต์ (ตัวกรองหน้าฟีด) */
export async function GET() {
  try {
    return NextResponse.json(await feedDbService.getCategories());
  } catch (err: any) {
    console.error('[API /api/feed/categories] Error:', err);
    return NextResponse.json({ error: publicErrorMessage(err, 'ไม่สามารถโหลดหมวดหมู่ได้') }, { status: 500 });
  }
}
