// ===== วางที่ src/app/api/gallery/unlock/route.ts (คนละไฟล์) =====
import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { userId, assetId, answer } = await req.json();

  // TODO: ตรวจคำตอบจริงตาม logic ของระบบ (เทียบกับคำตอบที่ถูกต้องใน DB หรือ column ที่เก็บเฉลยไว้)
  const isCorrect = true; // <-- แทนที่ด้วยการเช็คจริง

  const { rows } = await pool.query(
    `insert into photo_view_verifications (asset_id, user_id, question, is_passed, points_earned)
     values ($1, $2, (select unlock_question from ...), $3, $3::int * 5)
     returning *`,
    [assetId, userId, isCorrect]
  );

  if (isCorrect) {
    await pool.query(`update users set total_points = total_points + 5 where id = $1`, [userId]);
  }

  return NextResponse.json({ success: isCorrect });
}
 