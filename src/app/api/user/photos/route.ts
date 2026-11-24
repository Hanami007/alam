import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { parseStudentId } from '@/lib/student-id';
import { galleryDbService } from '@/modules/gallery/services/gallery.service';
import { nasImageUrl, nasTagService } from '@/modules/gallery/services/nas-tag.service';
import { nasCatalogService } from '@/services/nas/catalog.service';

/**
 * GET /api/user/photos — "อัลบั้มของฉัน" ในหน้าโปรไฟล์ (ของตัวเองเท่านั้น)
 *  - portrait:            รูปทำเนียบของฉัน หาจาก NAS อัตโนมัติด้วยรหัสนักศึกษา
 *  - taggedPhotos:        รูปที่มีฉัน (แท็กที่ยอมรับแล้ว)
 *  - pendingTags:         รูปที่มีคนแท็กฉัน รอฉันยอมรับ/ปฏิเสธ
 *  - unlockedGenerations: รุ่นที่ฉันปลดล็อกคลังภาพแล้ว
 * เดิมรับ ?userId= ของใครก็ได้โดยไม่เช็กสิทธิ์ — ตอนนี้ดูได้เฉพาะของตัวเอง
 */
export async function GET(req: NextRequest) {
  const empty = { portrait: null, taggedPhotos: [], pendingTags: [], unlockedGenerations: [] };
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json(empty, { status: 401 });
    const requested = req.nextUrl.searchParams.get('userId');
    if (requested && Number(requested) !== user.id) return NextResponse.json(empty);

    const parsedId = user.student_id ? parseStudentId(user.student_id) : null;
    const [album, unlockedGenerations, portraitPath] = await Promise.all([
      nasTagService.getAlbum(user.id).catch(() => ({ tagged: [], pending: [] })),
      galleryDbService.getUserUnlockedGenerations(user.id),
      parsedId
        ? nasCatalogService.findPortraitPath(parsedId.studentId, parsedId.generationNumber).catch(() => null)
        : Promise.resolve(null),
    ]);

    return NextResponse.json({
      portrait: portraitPath ? { path: portraitPath, imageUrl: nasImageUrl(portraitPath) } : null,
      taggedPhotos: album.tagged,
      pendingTags: album.pending,
      unlockedGenerations,
    });
  } catch (err) {
    console.error('Error fetching user photos:', err);
    return NextResponse.json(empty);
  }
}
