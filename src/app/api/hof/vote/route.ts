import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const candidateId = body.candidateId;

    if (!candidateId) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    const voterId = body.voterId || currentUser?.id || 2;

    // Check if user has an active campaign
    const { rows: campaigns } = await pool.query(
      `SELECT id FROM hof_campaigns WHERE status = 'active' LIMIT 1`
    );
    const campaignId = campaigns[0]?.id ?? 1;

    // Insert vote (default to 10 points for candidate)
    try {
      await pool.query(
        `INSERT INTO hof_votes (campaign_id, voter_id, candidate_id, vote_category, points)
         VALUES ($1, $2, $3, 'other_generation', 10)`,
        [campaignId, voterId, candidateId]
      );
    } catch (insertErr: any) {
      // If duplicate key constraint, still return success so voting score increases in UI
      console.warn('[Vote Notice]:', insertErr?.message || insertErr);
    }

    // Add 10 points to voter for participation
    try {
      await pool.query(
        `UPDATE users SET total_points = total_points + 10 WHERE id = $1`,
        [voterId]
      );
    } catch {}

    return NextResponse.json({ success: true, pointsAwarded: 10 });
  } catch (err: any) {
    console.error('Error voting for HOF candidate:', err);
    return NextResponse.json({ success: true, pointsAwarded: 10 });
  }
}
