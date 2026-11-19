import { readAvatarFile } from '@/lib/upload-storage';
import { NextResponse } from 'next/server';

/**
 * GET /api/uploads/avatars/<file> — ส่งไฟล์รูปโปรไฟล์จาก data/uploads/avatars
 * ชื่อไฟล์เป็น uuid/sha256 สุ่ม เดาไม่ได้ และไม่เปลี่ยนเนื้อหาหลังสร้าง จึง cache ได้ถาวร
 */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const result = await readAvatarFile(file);
  if (!result) {
    return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(result.data), {
    headers: {
      'Content-Type': result.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
