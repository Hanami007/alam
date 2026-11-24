import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { pool } from '@/lib/db';

/**
 * สิทธิ์ดูรูปจาก NAS (/api/nas/image และ /api/nas/image/[...slug])
 *
 * เดิม route รูปไม่ตรวจอะไรเลย (middleware ข้าม /api/nas) — ใครรู้ path ก็เปิดรูปได้แม้ไม่ได้ล็อกอิน
 * การ "ล็อก" ในคลังภาพเป็นแค่การเบลอรูปฝั่งหน้าเว็บ ตอนนี้ตรวจที่ server:
 *  - ไม่ได้ล็อกอิน → 401
 *  - แอดมิน → ดูได้ทุกรูป
 *  - สมาชิก → รุ่นที่ปลดล็อกแล้ว, รูปทำเนียบของตัวเอง (ชื่อไฟล์ = รหัสนักศึกษา), รูปที่ตัวเองถูกแท็ก
 */

const LOCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect width="300" height="400" fill="#e2e8f0"/><text x="150" y="210" text-anchor="middle" font-size="48">🔒</text></svg>`;

function denied(status: 401 | 403) {
  return new NextResponse(LOCK_SVG, {
    status,
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/** คืน null = ดูได้, คืน response = ถูกปฏิเสธ (ส่งกลับได้เลย) */
export async function checkNasImageAccess(target: {
  path?: string;
  generationNumber?: number;
  studentId?: string;
}): Promise<NextResponse | null> {
  const user = await getCurrentUser();
  if (!user) return denied(401);
  if (user.role === 'admin') return null;

  const genFromPath = target.path?.match(/รุ่น\s*(\d+)/);
  const genNumber = genFromPath ? Number(genFromPath[1]) : target.generationNumber;

  // รูปทำเนียบของตัวเอง — ให้อัลบั้มแสดงได้แม้ยังไม่ได้ปลดล็อกรุ่น
  const ownId = user.student_id && /^\d{8,10}$/.test(user.student_id) ? user.student_id : null;
  if (ownId) {
    const fileName = target.path?.split('/').pop() ?? '';
    if (target.studentId === ownId || fileName.startsWith(ownId)) return null;
  }

  if (genNumber) {
    const { rows } = await pool.query(
      `SELECT 1 FROM point_transactions WHERE user_id = $1 AND reason = 'unlock_generation' AND reference_id = $2 LIMIT 1`,
      [user.id, `รุ่น ${genNumber}`]
    );
    if (rows.length > 0) return null;
  }

  // รูปที่ตัวเองถูกแท็ก (รวมที่รอยืนยัน — ต้องเห็นรูปก่อนจึงกดยอมรับ/ปฏิเสธได้)
  if (target.path) {
    try {
      const { rows } = await pool.query(
        `SELECT 1 FROM nas_photo_tags WHERE photo_path = $1 AND tagged_user_id = $2 LIMIT 1`,
        [target.path, user.id]
      );
      if (rows.length > 0) return null;
    } catch {
      // ยังไม่ได้รัน migration nas_photo_tags
    }
  }

  return denied(403);
}
