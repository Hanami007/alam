import { NextResponse } from 'next/server';
import { publicErrorMessage } from '@/lib/api-error';
import { getCurrentUser } from '@/lib/auth';
import { pool } from '@/lib/db';
import { leaderService } from '@/modules/member/services/leader.service';

/**
 * GET /api/admin/yearbook — รายชื่อหนังสือรุ่น (ใช้ใน yearbook-grid)
 * เดิมมี POST/PUT/DELETE ให้แอดมินสร้าง "บัญชีปลอม" (รหัส MJxxxxxxxx, อีเมลสุ่ม, รูปสต็อก) และลบ users ตรงๆ
 * โดยไม่ล้างข้อมูลที่ผูกอยู่ — ไม่มีหน้าไหนเรียกใช้แล้ว จึงลบออก หนังสือรุ่นมาจากสมาชิกที่สมัครจริงเท่านั้น
 */
export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT 
        u.id,
        u.student_id as "studentId",
        u.name,
        COALESCE(u.nickname, '') as nickname,
        gen.label as generation,
        u.avatar_url as "avatarUrl",
        COALESCE(u.bio, '') as quote,
        COALESCE(u.company, '') as company,
        COALESCE(u.position, '') as position,
        COALESCE(u.is_available_for_mentorship, false) as "isAvailableForMentorship",
        u.student_status as "studentStatus",
        u.expected_graduation_year as "expectedGraduationYear",
        prov.label as province,
        ct.label as "careerType",
        u.created_at
      FROM users u
      LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
      LEFT JOIN lookup_options prov ON prov.id = u.hometown_province_id
      LEFT JOIN lookup_options ct ON ct.id = u.career_option_id
      WHERE u.yearbook_published = true
        AND u.status = 'approved'  -- บัญชีที่ยังรออนุมัติ/ถูกปฏิเสธ ไม่แสดงในหนังสือรุ่น
      ORDER BY u.id DESC
    `);

    // ยอดถูกใจ — แยก query ไว้ ถ้ายังไม่ได้รัน migration yearbook_likes หนังสือรุ่นต้องยังโหลดได้
    const viewer = await getCurrentUser();
    const likes = new Map<number, { like_count: number; liked_by_me: boolean }>();
    if (rows.length > 0) {
      try {
        const { rows: likeRows } = await pool.query(
          `SELECT user_id, COUNT(*)::int AS like_count, BOOL_OR(liked_by = $2) AS liked_by_me
           FROM yearbook_likes WHERE user_id = ANY($1::int[])
           GROUP BY user_id`,
          [rows.map((r) => r.id), viewer?.id ?? 0]
        );
        for (const l of likeRows) likes.set(l.user_id, l);
      } catch (err) {
        console.error('[API /api/admin/yearbook GET] yearbook likes error:', err);
      }
    }

    const leaderIds = new Set((await leaderService.listLeaders()).map((l) => l.userId));

    return NextResponse.json(
      rows.map((r) => ({
        ...r,
        isGenerationLeader: leaderIds.has(r.id),
        likeCount: likes.get(r.id)?.like_count ?? 0,
        likedByMe: Boolean(likes.get(r.id)?.liked_by_me),
      }))
    );
  } catch (err: any) {
    console.error('[API /api/admin/yearbook GET] Error:', err);
    return NextResponse.json({ error: publicErrorMessage(err, 'Error fetching yearbook list') }, { status: 500 });
  }
}
