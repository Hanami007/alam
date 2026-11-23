/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * ข้อมูลตัวอย่างสำหรับฝึกดู/เรียนรู้ฐานข้อมูล — ไม่ใช่ migration และห้ามใช้กับ production
 *
 *   npm run sample:seed    ใส่ข้อมูลตัวอย่าง (ล้างชุดเก่าก่อนทุกครั้ง รันซ้ำได้)
 *   npm run sample:clean   ลบข้อมูลตัวอย่างทั้งหมด
 *
 * ทุกแถวติดป้ายไว้ให้แยกออกจากข้อมูลจริงได้:
 * - users: อีเมล @sample.local (ล็อกอินได้ด้วยรหัสผ่าน sample1234 ยกเว้นคนที่ยังรออนุมัติ)
 * - posts / hof_campaigns / media_assets / wall_fortunes: ขึ้นต้นด้วย [ตัวอย่าง]
 * - audit_logs: metadata.sample = true, banned_keywords: ขึ้นต้นด้วย ตัวอย่าง-
 *
 * ไม่แตะ lookup_options (Master Data), sessions, login_attempts, system_settings
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://alumni:alumni_dev_password@localhost:5435/alumni_db';

const TAG = '[ตัวอย่าง]';
const EMAIL_DOMAIN = '@sample.local';
const PASSWORD = 'sample1234';

async function clean(db) {
  await db.query(`
    CREATE TEMP TABLE sample_users ON COMMIT DROP AS
    SELECT id FROM users WHERE email LIKE '%${EMAIL_DOMAIN}' AND role <> 'admin'
  `);
  await db.query(`
    CREATE TEMP TABLE sample_posts ON COMMIT DROP AS
    SELECT id FROM posts WHERE title LIKE '${TAG}%' OR requested_by IN (SELECT id FROM sample_users)
  `);

  // ลำดับการลบเหมือน AdminService.deleteUser — ลบตารางลูกก่อนตารางแม่ (FK ส่วนใหญ่ไม่ cascade)
  await db.query(`DELETE FROM polls WHERE post_id IN (SELECT id FROM sample_posts)`);
  await db.query(`DELETE FROM posts WHERE id IN (SELECT id FROM sample_posts)`);
  await db.query(`DELETE FROM hof_campaigns WHERE title LIKE '${TAG}%'`); // cascade: candidates, votes, results
  await db.query(`DELETE FROM media_assets WHERE caption LIKE '${TAG}%'`); // cascade: photo_tags, photo_view_verifications
  await db.query(`DELETE FROM audit_logs WHERE metadata->>'sample' = 'true'`);
  if (await tableExists(db, 'wall_fortunes')) {
    await db.query(`DELETE FROM wall_fortunes WHERE message LIKE '${TAG}%'`);
  }
  if (await tableExists(db, 'banned_keywords')) {
    await db.query(`DELETE FROM banned_keywords WHERE keyword LIKE 'ตัวอย่าง-%'`);
  }

  for (const sql of [
    `DELETE FROM post_interactions WHERE user_id IN (SELECT id FROM sample_users)`,
    `DELETE FROM poll_votes WHERE user_id IN (SELECT id FROM sample_users)`,
    `DELETE FROM hof_votes WHERE voter_id IN (SELECT id FROM sample_users)`,
    `DELETE FROM hof_results WHERE user_id IN (SELECT id FROM sample_users)`,
    `DELETE FROM hof_candidates WHERE user_id IN (SELECT id FROM sample_users)`,
    `DELETE FROM photo_tags WHERE tagged_user_id IN (SELECT id FROM sample_users) OR tagged_by IN (SELECT id FROM sample_users)`,
    `DELETE FROM photo_view_verifications WHERE user_id IN (SELECT id FROM sample_users)`,
    `DELETE FROM user_verifications WHERE user_id IN (SELECT id FROM sample_users)`,
    // sessions, point_transactions, notifications ลบตามไปเอง (ON DELETE CASCADE)
    `DELETE FROM users WHERE id IN (SELECT id FROM sample_users)`,
  ]) {
    await db.query(sql);
  }
}

async function tableExists(db, name) {
  const { rows } = await db.query(`SELECT to_regclass($1) IS NOT NULL AS ok`, [name]);
  return rows[0].ok;
}

async function lookupIds(db) {
  const { rows } = await db.query(`SELECT code, id FROM lookup_options`);
  const map = Object.fromEntries(rows.map((r) => [r.code, r.id]));
  return (code) => {
    if (!map[code]) throw new Error(`ไม่พบ lookup_options code=${code} — รัน npm run migrate:up ก่อน`);
    return map[code];
  };
}

async function insert(db, sql, params) {
  const { rows } = await db.query(sql, params);
  return rows[0];
}

async function seed(db) {
  const lookup = await lookupIds(db);
  const admin = await insert(db, `SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
  if (!admin) throw new Error('ไม่พบบัญชีแอดมิน — รัน npm run migrate:up ก่อน');
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // ─── users (5): ศิษย์เก่า 3 คน, ศิษย์ปัจจุบัน 2 คน (1 คนยังรออนุมัติ) ───────────
  // รุ่น n เข้าเรียนปี พ.ศ. 2537+n จบ 4 ปีถัดไป (สูตรเดียวกับ migration 005)
  const people = [
    { sid: 'SAMPLE-001', name: 'สมใจ เรียนดี', nick: 'ใจ', gen: 'gen-25', status: 'alumni', grad: 2566,
      home: 'th-cnx', work: 'th-bkk', career: 'career-private', company: 'บริษัทตัวอย่าง จำกัด', position: 'Backend Developer',
      bio: 'ชอบเขียน API และสอนน้องๆ เรื่อง Database', mentor: true },
    { sid: 'SAMPLE-002', name: 'ปิติ ขยันยิ่ง', nick: 'ปิติ', gen: 'gen-25', status: 'alumni', grad: 2566,
      home: 'th-kkc', work: 'th-kkc', career: 'career-gov', company: 'มหาวิทยาลัยตัวอย่าง', position: 'นักวิชาการคอมพิวเตอร์',
      bio: 'ดูแลระบบสารสนเทศของมหาวิทยาลัย', mentor: false },
    { sid: 'SAMPLE-003', name: 'มานี มีสุข', nick: 'มานี', gen: 'gen-20', status: 'alumni', grad: 2561,
      home: 'th-phk', work: 'intl-jp-tokyo', career: 'career-private', company: 'Sample Tech Japan', position: 'Data Engineer',
      bio: 'ทำงานด้าน Data ที่โตเกียว ยินดีให้คำปรึกษาเรื่องทำงานต่างประเทศ', mentor: true },
    { sid: 'SAMPLE-004', name: 'ชูใจ ใฝ่รู้', nick: 'ชูใจ', gen: 'gen-31', status: 'studying', grad: 2572,
      home: 'th-cnx', work: null, career: null, company: null, position: null,
      bio: 'สนใจ Web Development และ Cloud', mentor: false },
    { sid: 'SAMPLE-005', name: 'วีระ กล้าหาญ', nick: 'วีระ', gen: 'gen-32', status: 'studying', grad: 2573,
      home: 'th-bkk', work: null, career: null, company: null, position: null,
      bio: null, mentor: false, pending: true },
  ];

  const u = [];
  for (const [i, p] of people.entries()) {
    const row = await insert(db,
      `INSERT INTO users (
         student_id, email, password_hash, name, nickname, bio,
         generation_option_id, province_option_id, hometown_province_id, work_province_id, career_option_id,
         company, position, role, status, student_status, admission_year, expected_graduation_year,
         show_hometown_on_map, show_workplace_on_map, is_available_for_mentorship, yearbook_published
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10, $11, $12, 'alumni', $13, $14, $15, $16, $17, $18, $19, $20)
       RETURNING id`,
      [
        p.sid, `sample${i + 1}${EMAIL_DOMAIN}`, passwordHash, p.name, p.nick, p.bio,
        lookup(p.gen), lookup(p.home), p.work ? lookup(p.work) : null, p.career ? lookup(p.career) : null,
        p.company, p.position, p.pending ? 'pending' : 'approved', p.status, p.grad - 4, p.grad,
        !p.pending, Boolean(p.work), p.mentor, Boolean(p.bio) && !p.pending,
      ]
    );
    u.push(row.id);
  }
  const [u1, u2, u3, u4, u5] = u;

  // ─── user_verifications (5): ประวัติการอนุมัติสมาชิก ────────────────────────
  for (const [userId, approver, source, status, remark] of [
    [u1, admin.id, 'admin_manual', 'approved', 'ตรวจรหัสนักศึกษากับทะเบียนแล้ว'],
    [u2, null, 'registrar_api', 'approved', 'ข้อมูลตรงกับสำนักทะเบียน'],
    [u3, u1, 'batchmate_endorsement', 'approved', 'เพื่อนร่วมรุ่นยืนยันตัวตน'],
    [u4, admin.id, 'admin_manual', 'approved', null],
    [u5, null, 'admin_manual', 'pending', 'รอแอดมินตรวจสอบ'],
  ]) {
    await db.query(
      `INSERT INTO user_verifications (user_id, admin_id, source, status, remark) VALUES ($1, $2, $3, $4, $5)`,
      [userId, approver, source, status, remark]
    );
  }

  // ─── posts (5): ประกาศแอดมิน, โพสต์ที่สมาชิกขอ, โพล, คำขอที่รออนุมัติ ──────────
  const post = async (adminId, requestedBy, category, title, content, type, status, pinned) =>
    (await insert(db,
      `INSERT INTO posts (admin_id, requested_by, category, title, content, post_type, status, pinned, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CASE WHEN $7 = 'published' THEN now() END)
       RETURNING id`,
      [adminId, requestedBy, category, `${TAG} ${title}`, content, type, status, pinned]
    )).id;
  const p1 = await post(admin.id, null, 'ประกาศ', 'เปิดรับพี่เลี้ยง Mentorship รอบใหม่',
    'ศิษย์เก่าที่สนใจเป็นพี่เลี้ยงให้น้องปี 4 เปิดสถานะ "รับให้คำปรึกษา" ในโปรไฟล์ได้เลย', 'normal', 'published', true);
  const p2 = await post(null, u1, 'กิจกรรม', 'ชวนเตะฟุตบอลศิษย์เก่า-ศิษย์ปัจจุบัน',
    'เสาร์นี้ 4 โมงเย็น สนามกลางมหาวิทยาลัย ใครว่างมาเจอกัน', 'normal', 'published', false);
  const p3 = await post(null, u4, 'ถาม-ตอบ', 'ฝึกงานสาย Backend ที่ไหนดีครับ',
    'อยากได้คำแนะนำจากพี่ๆ ว่าบริษัทไหนรับฝึกงานและได้ลงมือทำจริง', 'normal', 'published', false);
  const p4 = await post(admin.id, null, 'โพลสำรวจความเห็น', 'งานเลี้ยงรุ่นปีนี้จัดที่ไหนดี',
    'โหวตได้คนละ 1 ครั้ง ได้แต้มสะสมทันที', 'poll', 'published', false);
  await post(null, u2, 'ประชาสัมพันธ์', 'รับสมัครนักวิชาการคอมพิวเตอร์ 2 อัตรา',
    'รบกวนแอดมินช่วยเผยแพร่ให้ครับ', 'normal', 'pending_request', false);

  // ─── post_interactions (5): คอมเมนต์ 3, รีแอคชัน 2 ─────────────────────────
  for (const [postId, userId, type, content, emoji, pts] of [
    [p1, u2, 'comment', 'สนใจครับ เดี๋ยวไปเปิดสถานะในโปรไฟล์', null, 1],
    [p2, u4, 'comment', 'ไปด้วยค่ะ!', null, 1],
    [p3, u1, 'comment', 'ลองดูบริษัทที่มีทีม Backend ชัดเจน แล้วถามเรื่อง mentor ตอนสัมภาษณ์', null, 1],
    [p1, u3, 'reaction', null, 'love', 0],
    [p2, u2, 'reaction', null, 'like', 0],
  ]) {
    await db.query(
      `INSERT INTO post_interactions (post_id, user_id, type, content, emoji_option_id, points_earned)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [postId, userId, type, content, emoji ? lookup(emoji) : null, pts]
    );
  }

  // ─── polls (1) → poll_options (5) → poll_votes (5) ─────────────────────────
  const poll = await insert(db,
    `INSERT INTO polls (post_id, question, points_per_vote, status) VALUES ($1, $2, 5, 'active') RETURNING id`,
    [p4, 'สถานที่จัดงานเลี้ยงรุ่น']
  );
  const options = [];
  for (const text of ['ร้านอาหารในเมืองเชียงใหม่', 'ห้องจัดเลี้ยงในมหาวิทยาลัย', 'ล่องแพแม่น้ำปิง', 'แคมป์ปิ้งดอยสุเทพ', 'ออนไลน์']) {
    options.push((await insert(db,
      `INSERT INTO poll_options (poll_id, option_text) VALUES ($1, $2) RETURNING id`, [poll.id, text])).id);
  }
  for (const [userId, optIdx] of [[u1, 0], [u2, 0], [u3, 2], [u4, 1], [u5, 3]]) {
    await db.query(
      `INSERT INTO poll_votes (poll_id, option_id, user_id, points_awarded) VALUES ($1, $2, $3, 5)`,
      [poll.id, options[optIdx], userId]
    );
  }

  // ─── hof_campaigns (5): 4 รอบที่ปิดแล้ว + 1 รอบที่เปิดอยู่ ───────────────────
  // แอปถือว่าแคมเปญ id ล่าสุดคือ "รอบปัจจุบัน" — รอบ 5 จึงต้องสร้างเป็นอันสุดท้าย
  const campaigns = [];
  for (const [n, quarter, start, end, status] of [
    [1, 'Q3/2568', '2025-07-01', '2025-09-30', 'closed'],
    [2, 'Q4/2568', '2025-10-01', '2025-12-31', 'closed'],
    [3, 'Q1/2569', '2026-01-01', '2026-03-31', 'closed'],
    [4, 'Q2/2569', '2026-04-01', '2026-06-30', 'closed'],
    [5, 'Q3/2569', '2026-07-01', '2026-09-30', 'open'],
  ]) {
    campaigns.push((await insert(db,
      `INSERT INTO hof_campaigns (title, status, cycle_number, quarter, period_start, period_end, finalized_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      // ประกาศผลแล้วเฉพาะรอบ 4 (มี hof_results ด้านล่าง)
      [`${TAG} ศิษย์เก่าดีเด่น รอบที่ ${n} (${quarter})`, status, n, quarter, start, end, n === 4 ? end : null]
    )).id);
  }
  const c4 = campaigns[3];
  const c5 = campaigns[4];

  // ─── hof_candidates (5): ผู้เข้าชิงต้องเป็นศิษย์เก่าเท่านั้น ───────────────────
  const candidate = async (campaignId, userId, description) =>
    (await insert(db,
      `INSERT INTO hof_candidates (campaign_id, user_id, description) VALUES ($1, $2, $3) RETURNING id`,
      [campaignId, userId, description]
    )).id;
  const c4u1 = await candidate(c4, u1, 'สอนเขียน API ให้น้องๆ ฟรีทุกเดือน');
  const c4u3 = await candidate(c4, u3, 'พาน้องไปฝึกงานต่างประเทศ 3 คน');
  const c5u1 = await candidate(c5, u1, 'เป็นพี่เลี้ยง Mentorship 5 คน');
  const c5u2 = await candidate(c5, u2, 'พัฒนาระบบลงทะเบียนให้คณะ');
  const c5u3 = await candidate(c5, u3, 'บรรยายเรื่อง Data Engineering ให้รุ่นน้อง');

  // ─── hof_votes (5): ในรอบปัจจุบัน คนละ 1 โหวต (ห้ามโหวตตัวเอง — มี trigger กันไว้) ──
  // vote_category: รุ่นเดียวกัน = same_generation, ต่างรุ่น = other_generation
  for (const [voter, cand, category] of [
    [u2, c5u1, 'same_generation'], // ปิติ (รุ่น 25) → สมใจ (รุ่น 25)
    [u4, c5u1, 'other_generation'],
    [u5, c5u3, 'other_generation'],
    [u1, c5u3, 'other_generation'],
    [u3, c5u2, 'other_generation'],
  ]) {
    await db.query(
      `INSERT INTO hof_votes (campaign_id, voter_id, candidate_id, vote_category, points) VALUES ($1, $2, $3, $4, 1)`,
      [c5, voter, cand, category]
    );
  }

  // ─── hof_results (2): ผลประกาศของรอบ 4 (snapshot ข้อมูล ณ วันประกาศ) ─────────
  for (const [cand, userId, rank, votes, p] of [[c4u1, u1, 1, 7, people[0]], [c4u3, u3, 2, 4, people[2]]]) {
    await db.query(
      `INSERT INTO hof_results (campaign_id, candidate_id, user_id, rank, total_votes, total_points,
                                snapshot_name, snapshot_company, snapshot_position, snapshot_generation, snapshot_achievement)
       SELECT $1, $2, $3, $4, $5, $5, $6, $7, $8, lo.label, hc.description
       FROM hof_candidates hc, lookup_options lo
       WHERE hc.id = $2 AND lo.code = $9`,
      [c4, cand, userId, rank, votes, p.name, p.company, p.position, p.gen]
    );
  }

  // ─── media_assets (5): แกลเลอรีส่วนตัว 2, คลังภาพรุ่น 3 ─────────────────────
  const media = async (ownerType, ownerId, gen, uploadedBy, seedName, caption) =>
    (await insert(db,
      `INSERT INTO media_assets (owner_type, owner_id, generation_option_id, uploaded_by, image_url, caption)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [ownerType, ownerId, gen ? lookup(gen) : null, uploadedBy,
       `https://picsum.photos/seed/${seedName}/800/600`, `${TAG} ${caption}`]
    )).id;
  const m1 = await media('user_gallery', u1, null, u1, 'sample-gallery-1', 'ทริปดอยอินทนนท์กับเพื่อนร่วมรุ่น');
  await media('user_gallery', u3, null, u3, 'sample-gallery-2', 'ออฟฟิศที่โตเกียว');
  const m3 = await media('photo_archive', null, 'gen-25', admin.id, 'sample-archive-1', 'รับปริญญา รุ่น 25');
  const m4 = await media('photo_archive', null, 'gen-25', admin.id, 'sample-archive-2', 'ค่ายคอมพิวเตอร์ รุ่น 25');
  const m5 = await media('photo_archive', null, 'gen-20', admin.id, 'sample-archive-3', 'กีฬาสี รุ่น 20');

  // ─── photo_tags (5): ใครอยู่ในรูปไหน (manual = คนแท็ก, ai = ระบบแท็ก) ──────────
  for (const [asset, tagged, taggedBy, source] of [
    [m3, u1, u2, 'manual'],
    [m3, u2, null, 'ai'],
    [m4, u1, u1, 'manual'],
    [m5, u3, admin.id, 'manual'],
    [m1, u2, u1, 'manual'],
  ]) {
    await db.query(
      `INSERT INTO photo_tags (asset_id, tagged_user_id, tagged_by, tag_source) VALUES ($1, $2, $3, $4)`,
      [asset, tagged, taggedBy, source]
    );
  }

  // ─── photo_view_verifications (5): ตอบคำถามก่อนดูรูปคลังภาพ ─────────────────
  for (const [asset, userId, passed] of [[m3, u1, true], [m3, u2, true], [m4, u4, false], [m5, u3, true], [m3, u5, false]]) {
    await db.query(
      `INSERT INTO photo_view_verifications (asset_id, user_id, question, is_passed, points_earned)
       VALUES ($1, $2, 'อาจารย์ที่ปรึกษาของรุ่นนี้ชื่ออะไร?', $3, $4)`,
      [asset, userId, passed, passed ? 5 : 0]
    );
  }

  // ─── point_transactions (5) + users.total_points ให้ตรงกัน ──────────────────
  for (const [userId, pts, reason, ref] of [
    [u1, 5, 'poll_vote', `poll:${poll.id}`],
    [u1, 1, 'comment_post', `post:${p3}`],
    [u2, 1, 'comment_post', `post:${p1}`],
    [u3, 1, 'hof_vote', `campaign:${c5}`],
    [u4, 1, 'comment_post', `post:${p2}`],
  ]) {
    await db.query(
      `INSERT INTO point_transactions (user_id, points, reason, reference_id) VALUES ($1, $2, $3, $4)`,
      [userId, pts, reason, ref]
    );
  }
  await db.query(
    `UPDATE users u SET total_points = COALESCE((SELECT SUM(points) FROM point_transactions WHERE user_id = u.id), 0)
     WHERE u.id = ANY($1::int[])`,
    [u]
  );

  // ─── notifications (5) ───────────────────────────────────────────────────────
  for (const [userId, type, title, message, link, read] of [
    [u1, 'user_approved', 'บัญชีได้รับการอนุมัติแล้ว', 'ยินดีต้อนรับสู่ระบบศิษย์เก่า', '/feed', true],
    [u1, 'comment', 'มีคนตอบโพสต์ของคุณ', 'ชูใจ ใฝ่รู้ แสดงความคิดเห็นในโพสต์ฟุตบอล', '/feed', false],
    [u4, 'comment', 'มีคนตอบคำถามของคุณ', 'สมใจ เรียนดี ตอบเรื่องที่ฝึกงานแล้ว', '/feed', false],
    [u2, 'system', 'คำขอโพสต์อยู่ระหว่างตรวจสอบ', 'แอดมินจะตรวจสอบโพสต์รับสมัครงานของคุณ', '/feed', false],
    [u5, 'system', 'รอการอนุมัติบัญชี', 'แอดมินกำลังตรวจสอบข้อมูลของคุณ', null, false],
  ]) {
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, link, is_read) VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, type, title, message, link, read]
    );
  }

  // ─── audit_logs (5): สิ่งที่แอดมินทำ ───────────────────────────────────────
  for (const [action, targetType, targetId, meta] of [
    ['approve_user', 'user', u1, { name: people[0].name }],
    ['approve_user', 'user', u4, { name: people[3].name }],
    ['create_post', 'post', p1, {}],
    ['approve_post', 'post', p2, {}],
    ['hof_finalize', 'campaign', c4, { top: 2 }],
  ]) {
    await db.query(
      `INSERT INTO audit_logs (actor_id, action, target_type, target_id, metadata) VALUES ($1, $2, $3, $4, $5)`,
      [admin.id, action, targetType, targetId, JSON.stringify({ ...meta, sample: true })]
    );
  }

  // ─── wall_fortunes (5) + banned_keywords (5) — ตารางที่แอปสร้างเองตอนใช้งานครั้งแรก ──
  if (await tableExists(db, 'wall_fortunes')) {
    for (const msg of [
      'วันนี้โค้ดคอมไพล์ผ่านตั้งแต่ครั้งแรก 🍀',
      'จะได้เจอเพื่อนเก่าที่ไม่ได้เจอกันนาน 👋',
      'งานที่ค้างอยู่จะเสร็จก่อนเดดไลน์ ✨',
      'มีคนมาขอคำปรึกษา ลองเปิดรับ Mentorship ดู 💬',
      'อย่าลืม commit ก่อนกลับบ้าน 💾',
    ]) {
      await db.query(`INSERT INTO wall_fortunes (message) VALUES ($1)`, [`${TAG} ${msg}`]);
    }
  }
  if (await tableExists(db, 'banned_keywords')) {
    for (let i = 1; i <= 5; i++) {
      await db.query(`INSERT INTO banned_keywords (keyword, added_by) VALUES ($1, $2)`, [`ตัวอย่าง-คำต้องห้าม-${i}`, admin.id]);
    }
  }
}

async function main() {
  const onlyClean = process.argv.includes('--clean');
  const pool = new Pool({ connectionString: DATABASE_URL });
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    await clean(db);
    if (!onlyClean) await seed(db);
    await db.query('COMMIT');
    console.log(onlyClean ? 'ลบข้อมูลตัวอย่างแล้ว' : `ใส่ข้อมูลตัวอย่างแล้ว — ล็อกอินด้วย sample1${EMAIL_DOMAIN} / ${PASSWORD}`);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('ไม่สำเร็จ (ยกเลิกทั้งหมด ไม่มีอะไรเปลี่ยน):', err.message);
    process.exitCode = 1;
  } finally {
    db.release();
    await pool.end();
  }
}

main();
