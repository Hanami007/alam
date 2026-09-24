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
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'กรุณาเข้าสู่ระบบก่อนโหวต' }, { status: 401 });
    }
    // ใช้ currentUser.id จาก session เสมอ — ห้ามเชื่อ voterId ที่ client ส่งมา (กันโหวตแทนคนอื่น)
    const voterId = currentUser.id;

    // ตรวจสอบว่ามีแคมเปญที่เปิดโหวตอยู่หรือไม่ — เดิมเช็ค status = 'active' ซึ่งไม่มีค่านี้ใน DB จริง
    // (DB constraint อนุญาตแค่ 'open'/'closed') ทำให้เงื่อนไขนี้ไม่เคยเป็นจริง และ fallback ไป
    // campaignId = 1 เสมอ กลายเป็นว่าปิดโหวตแล้วก็ยังโหวตผ่านได้อยู่ดี แก้ให้เช็คค่าที่ถูกต้อง
    // และปฏิเสธการโหวตจริงๆ เมื่อไม่มีแคมเปญที่เปิดอยู่
    const { rows: campaigns } = await pool.query(
      `SELECT id FROM hof_campaigns WHERE status = 'open' LIMIT 1`
    );
    if (campaigns.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ขณะนี้ยังไม่เปิดโหวต Hall of Fame' },
        { status: 403 }
      );
    }
    const campaignId = campaigns[0].id;

    // ห้ามโหวตซ้ำผู้เข้าชิงคนเดิม
    const { rows: existingForCandidate } = await pool.query(
      `SELECT id FROM hof_votes WHERE voter_id = $1 AND candidate_id = $2`,
      [voterId, candidateId]
    );
    if (existingForCandidate.length > 0) {
      return NextResponse.json(
        { success: false, error: 'คุณโหวตให้ผู้ได้รับการเสนอชื่อท่านนี้ไปแล้ว' },
        { status: 409 }
      );
    }

    // กติกา: โหวตได้ในรุ่นตัวเอง 1 ครั้ง และนอกรุ่นตัวเอง 1 ครั้ง (รวมสูงสุด 2 โหวตต่อแคมเปญ)
    const { rows: voter } = await pool.query(`SELECT generation_option_id FROM users WHERE id = $1`, [voterId]);
    const { rows: candidate } = await pool.query(
      `SELECT u.generation_option_id
       FROM hof_candidates hc
       JOIN users u ON u.id = hc.user_id
       WHERE hc.id = $1`,
      [candidateId]
    );
    const voterGen = voter[0]?.generation_option_id;
    const candidateGen = candidate[0]?.generation_option_id;
    const voteCategory = voterGen && candidateGen && voterGen === candidateGen ? 'same_generation' : 'other_generation';

    const { rows: existingInCategory } = await pool.query(
      `SELECT id FROM hof_votes WHERE campaign_id = $1 AND voter_id = $2 AND vote_category = $3`,
      [campaignId, voterId, voteCategory]
    );
    if (existingInCategory.length > 0) {
      const usedUpMessage =
        voteCategory === 'same_generation'
          ? 'คุณใช้สิทธิ์โหวตในรุ่นตัวเองไปแล้ว'
          : 'คุณใช้สิทธิ์โหวตนอกรุ่นตัวเองไปแล้ว';
      return NextResponse.json({ success: false, error: usedUpMessage }, { status: 409 });
    }

    // ผู้ถูกโหวตได้ 1 คะแนนเสมอต่อโหวต (ไม่แบ่ง 5/10 ตามรุ่นแล้ว — รุ่นมีผลแค่กับโควตาสิทธิ์โหวต)
    // บันทึกโหวต + ให้แต้มผู้โหวตอยู่ใน transaction เดียวกัน — เดิมการให้แต้มห่อด้วย
    // catch {} เงียบๆ แยกจากการบันทึกโหวต ถ้าการให้แต้มพัง โหวตจะถูกบันทึกไปแล้วแต่
    // response ยัง success:true พร้อม pointsAwarded:10 เหมือนเดิมทุกครั้ง (โกหก client)
    // ใช้ transaction ให้ถ้าขั้นไหนพัง ทั้งคู่ rollback กลับเป็นเหมือนไม่เคยโหวต แทน
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO hof_votes (campaign_id, voter_id, candidate_id, vote_category, points)
         VALUES ($1, $2, $3, $4, 1)`,
        [campaignId, voterId, candidateId, voteCategory]
      );
      await client.query(
        `UPDATE users SET total_points = total_points + 10 WHERE id = $1`,
        [voterId]
      );
      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    try {
      await pool.query(
        `INSERT INTO point_transactions (user_id, points, reason, reference_id)
         VALUES ($1, 10, 'hof_vote', $2)`,
        [voterId, String(candidateId)]
      );
    } catch (logErr) {
      // ตารางบันทึกประวัติแต้ม ไม่ใช่ผลลัพธ์หลักของการโหวต พังแล้วไม่ต้อง rollback การโหวต
      // แต่ต้อง log ไว้เห็นใน server logs (เดิม catch เงียบสนิทไม่ log อะไรเลย)
      console.error('[HOF vote] point_transactions insert failed:', logErr);
    }

    return NextResponse.json({ success: true, pointsAwarded: 10, voteCategory });
  } catch (err: any) {
    console.error('Error voting for HOF candidate:', err);
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
  }
}
