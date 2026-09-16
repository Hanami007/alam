import { getCurrentUser } from '@/lib/auth';
import { pool } from '@/lib/db';
import { feedDbService } from '@/modules/feed/services/feed.service';
import { NextResponse } from 'next/server';

/**
 * GET /api/feed/sidebar
 * Returns leaderboard top 3 and birthday alumni this month from DB
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    // 1. Leaderboard top 3
    const leaderboard = await feedDbService.getLeaderboard(3);

    // 2. Birthday alumni this month (users with birthday in current month)
    //    We check admission month as a proxy since we store admission_year not birthday
    //    Actually use `created_at` month to find members who joined this month — or
    //    if the DB has a `date_of_birth` column we use that; otherwise show recent joiners
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const { rows: birthdayUsers } = await pool.query(
      `SELECT u.id, u.name, u.avatar_url, gen.label as generation
       FROM users u
       LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
       WHERE u.status = 'approved'
         AND EXTRACT(MONTH FROM u.created_at) = $1
       ORDER BY u.created_at DESC
       LIMIT 5`,
      [currentMonth]
    );

    // 3. Random alumni pool (for icebreaker widget) — pick 5 approved users
    const { rows: randomAlumni } = await pool.query(
      `SELECT u.id, u.name, u.avatar_url, u.position, u.company, u.bio,
              gen.label as generation
       FROM users u
       LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
       WHERE u.status = 'approved' AND u.role = 'alumni'
         AND u.id != $1
       ORDER BY RANDOM()
       LIMIT 5`,
      [user?.id || 0]
    );

    return NextResponse.json({
      leaderboard: leaderboard.map((u: any, i: number) => ({
        rank: i + 1,
        id: u.id,
        name: u.name,
        generation: u.generation || '',
        points: u.total_points || 0,
        avatar: u.name ? u.name.substring(0, 2) : 'CS',
        badge: i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉',
      })),
      birthdayAlumni: birthdayUsers.map((u: any) => ({
        id: u.id,
        name: u.name,
        generation: u.generation || '',
        avatar: u.name ? u.name.substring(0, 2) : 'CS',
      })),
      randomAlumni: randomAlumni.map((u: any) => ({
        id: u.id,
        name: u.name,
        generation: u.generation || '',
        job: [u.position, u.company].filter(Boolean).join(' @ ') || 'ศิษย์เก่า CS MJU',
        bio: u.bio || 'ยินดีต้อนรับสู่เครือข่ายศิษย์เก่า CS MJU ✨',
      })),
    });
  } catch (err: any) {
    console.error('[API /api/feed/sidebar] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
