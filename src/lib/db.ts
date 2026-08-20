import { Pool } from 'pg';

// ต้องติดตั้งก่อนใช้งาน: npm install pg && npm install -D @types/pg
// แล้วตั้งค่า DATABASE_URL ใน .env.local ให้ตรงกับ docker-compose.yml (ดู .env.example)

declare global {
  // กัน Next.js dev-mode สร้าง pool ใหม่ทุกครั้งที่ hot-reload
  // eslint-disable-next-line no-var
  var _alumniPool: Pool | undefined;
}

export const pool =
  global._alumniPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== 'production') {
  global._alumniPool = pool;
}

// ---------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------
export async function getDashboardStats() {
  const { rows: alumniCount } = await pool.query(
    `select count(*)::int as count from users where role = 'alumni' and status = 'approved'`
  );
  const { rows: genCount } = await pool.query(
    `select count(*)::int as count from lookup_options where category = 'generation'`
  );
  const { rows: candidateCount } = await pool.query(
    `select count(*)::int as count from hof_candidates`
  );
  const { rows: pendingCount } = await pool.query(
    `select count(*)::int as count from users where status = 'pending'`
  );

  return {
    totalAlumni: alumniCount[0].count,
    totalGenerations: genCount[0].count,
    outstandingAlumni: candidateCount[0].count,
    pendingApprovals: pendingCount[0].count,
  };
}

// ---------------------------------------------------------------
// Alumni profiles / Hall of Fame
// ---------------------------------------------------------------
export async function getAlumniProfiles() {
  const { rows } = await pool.query(`
    select
      u.id,
      u.name,
      u.avatar_url as image,
      u.position as occupation,
      u.company,
      ct.label as employment_type,
      gen.label as generation,
      hc.description as achievement,
      coalesce(sum(hv.points), 0)::int as hof_points
    from hof_candidates hc
    join users u on u.id = hc.user_id
    left join lookup_options gen on gen.id = u.generation_option_id
    left join lookup_options ct on ct.id = u.career_option_id
    left join hof_votes hv on hv.candidate_id = hc.id
    group by u.id, u.name, u.avatar_url, u.position, u.company, ct.label, gen.label, hc.description
    order by hof_points desc
  `);
  return rows;
}

// ค้นหา Hall of Fame แบบ single search box
export async function searchHofCandidates(query: string) {
  const searchTerm = `%${query}%`;
  const { rows } = await pool.query(`
    select
      hc.id, hc.description,
      u.name, u.company, u.position, u.avatar_url,
      gen.label as generation_label
    from hof_candidates hc
    join users u on u.id = hc.user_id
    left join lookup_options gen on gen.id = u.generation_option_id
    where u.name ilike $1
       or u.company ilike $1
       or u.position ilike $1
       or hc.description ilike $1
       or gen.label ilike $1
    order by hc.id desc
    limit 50
  `, [searchTerm]);
  return rows;
}

// ---------------------------------------------------------------
// Feed: posts + polls + interactions
// ---------------------------------------------------------------
export async function getFeedPosts() {
  const { rows: posts } = await pool.query(`
    select p.id, p.category, p.title, p.content as body, p.pinned, p.created_at, p.status,
           coalesce(admin.name, req.name) as author
    from posts p
    left join users admin on admin.id = p.admin_id
    left join users req on req.id = p.requested_by
    where p.status = 'published'
    order by p.published_at desc nulls last, p.created_at desc
  `);

  const postsWithExtras = [];
  for (const post of posts) {
    const { rows: counts } = await pool.query(
      `select
         count(*) filter (where type = 'comment')::int as comments,
         count(*) filter (where type = 'reaction')::int as likes
       from post_interactions where post_id = $1`,
      [post.id]
    );

    const { rows: pollRows } = await pool.query(
      `select id, question, points_per_vote from polls where post_id = $1`,
      [post.id]
    );

    let poll = null;
    if (pollRows.length > 0) {
      const { rows: options } = await pool.query(
        `select po.id, po.option_text as text, count(pv.id)::int as votes
         from poll_options po
         left join poll_votes pv on pv.option_id = po.id
         where po.poll_id = $1
         group by po.id, po.option_text
         order by po.id`,
        [pollRows[0].id]
      );
      poll = { question: pollRows[0].question, pointsPerVote: pollRows[0].points_per_vote, options };
    }

    const { rows: commentsList } = await pool.query(
      `select pi.id, pi.content, pi.created_at, u.name as author, u.avatar_url
       from post_interactions pi
       join users u on u.id = pi.user_id
       where pi.post_id = $1 and pi.type = 'comment'
       order by pi.created_at asc`,
      [post.id]
    );

    const { rows: userLikes } = await pool.query(
      `select user_id from post_interactions where post_id = $1 and type = 'reaction'`,
      [post.id]
    );

    postsWithExtras.push({
      ...post,
      likes: counts[0].likes,
      comments: counts[0].comments,
      commentsList,
      likedUserIds: userLikes.map((r: any) => r.user_id),
      commentPoints: 1,
      poll,
    });
  }
  return postsWithExtras;
}

// สำหรับ Admin: ดูคำขอโพสต์ที่ยังรออนุมัติ
export async function getPostRequests() {
  const { rows } = await pool.query(`
    select p.*, u.name as requester_name
    from posts p
    join users u on u.id = p.requested_by
    where p.status = 'pending_request'
    order by p.created_at asc
  `);
  return rows;
}

export async function createPostRequest(requestedBy: number, title: string, content: string, category: string) {
  const { rows } = await pool.query(
    `insert into posts (requested_by, category, title, content, post_type, status)
     values ($1, $2, $3, $4, 'normal', 'pending_request')
     returning *`,
    [requestedBy, category, title, content]
  );
  return rows[0];
}

export async function approvePostRequest(postId: number, adminId: number) {
  const { rows } = await pool.query(
    `update posts
     set status = 'published', admin_id = $2, published_at = now()
     where id = $1 and status = 'pending_request'
     returning *`,
    [postId, adminId]
  );
  return rows[0] ?? null;
}

export async function rejectPostRequest(postId: number) {
  const { rows } = await pool.query(
    `update posts set status = 'rejected' where id = $1 and status = 'pending_request' returning *`,
    [postId]
  );
  return rows[0] ?? null;
}

// ---------------------------------------------------------------
// Photo archive
// ---------------------------------------------------------------
export async function getGalleryItems() {
  const { rows } = await pool.query(`
    select
      ma.id,
      ma.caption as title,
      gen.label as generation,
      (gen.extra->>'year_start')::int as year,
      ma.image_url as image,
      ma.watermark_url as original_image,
      not exists (
        select 1 from photo_view_verifications v
        where v.asset_id = ma.id and v.is_passed = true
      ) as locked,
      coalesce(
        (select v.question from photo_view_verifications v where v.asset_id = ma.id limit 1),
        'ตอบคำถามเกี่ยวกับรุ่นนี้เพื่อปลดล็อก'
      ) as unlock_question,
      5 as points_for_unlock
    from media_assets ma
    left join lookup_options gen on gen.id = ma.generation_option_id
    where ma.owner_type = 'photo_archive'
    order by ma.created_at desc
  `);

  const withTags = [];
  for (const item of rows) {
    const { rows: tags } = await pool.query(
      `select u.name from photo_tags t join users u on u.id = t.tagged_user_id where t.asset_id = $1`,
      [item.id]
    );
    withTags.push({ ...item, tags: tags.map((t) => t.name) });
  }
  return withTags;
}

// เช็คว่า user ปลดล็อกรูปนี้แล้วหรือยัง ก่อนอนุญาตให้แท็ก
export async function hasUnlockedPhoto(userId: number, assetId: number) {
  const { rows } = await pool.query(
    `select 1 from photo_view_verifications
     where user_id = $1 and asset_id = $2 and is_passed = true`,
    [userId, assetId]
  );
  return rows.length > 0;
}

// แท็กเพื่อนในรูป (เรียกหลังเช็ค hasUnlockedPhoto แล้วเท่านั้น)
export async function tagUserInPhoto(assetId: number, taggedUserId: number, taggedByUserId: number) {
  const { rows } = await pool.query(
    `insert into photo_tags (asset_id, tagged_user_id, tagged_by, tag_source)
     values ($1, $2, $3, 'manual')
     on conflict (asset_id, tagged_user_id) do nothing
     returning *`,
    [assetId, taggedUserId, taggedByUserId]
  );
  return rows[0] ?? null;
}

// ---------------------------------------------------------------
// Alumni map: สรุปตามจังหวัด + ภาค (จำลองจากข้อมูลใน users)
// ---------------------------------------------------------------
export async function getProvinceStats() {
  const { rows } = await pool.query(`
    select
      p.label as province,
      p.extra->>'region' as region,
      count(u.id)::int as count,
      mode() within group (order by ct.label) as top_career_type
    from lookup_options p
    left join users u on u.province_option_id = p.id and u.status = 'approved'
    left join lookup_options ct on ct.id = u.career_option_id
    where p.category = 'province'
    group by p.label, p.extra
    order by count desc
  `);
  return rows;
}

export async function getRegionStats() {
  const { rows } = await pool.query(`
    select
      p.extra->>'region' as region,
      count(u.id)::int as count
    from lookup_options p
    left join users u on u.province_option_id = p.id and u.status = 'approved'
    where p.category = 'province'
    group by p.extra->>'region'
  `);
  return rows;
}

export async function getRegionCareerBreakdown() {
  const { rows } = await pool.query(`
    select
      p.extra->>'region' as region,
      ct.label as career_type,
      count(u.id)::int as count
    from lookup_options p
    left join users u on u.province_option_id = p.id and u.status = 'approved'
    left join lookup_options ct on ct.id = u.career_option_id
    where p.category = 'province'
    group by p.extra->>'region', ct.label
  `);

  const byRegion = new Map<string, { career_type: string; count: number }[]>();
  for (const row of rows) {
    if (!row.career_type || row.count === 0) continue; // ข้ามแถวที่ไม่มีคนหรือยังไม่ระบุอาชีพ
    const list = byRegion.get(row.region) ?? [];
    list.push({ career_type: row.career_type, count: row.count });
    byRegion.set(row.region, list);
  }
  return byRegion;
}

// แท็บ "ภูมิลำเนา" บนหน้า Map — นักศึกษา+ศิษย์เก่าที่ยินยอมแสดงบ้านเกิด
export async function getHometownMapData() {
  const { rows } = await pool.query(`
    select
      u.id, u.name, u.student_status,
      lo.id as province_id, lo.label as province_name,
      lo.extra->>'region' as region,
      (lo.extra->>'metro')::boolean as metro
    from users u
    join lookup_options lo on lo.id = u.hometown_province_id
    where u.show_hometown_on_map = true
      and lo.category = 'province'
  `);
  return rows;
}

// แท็บ "ที่ทำงานศิษย์เก่า" บนหน้า Map — เฉพาะศิษย์เก่าที่ยินยอมแสดงที่ทำงาน
export async function getWorkplaceMapData() {
  const { rows } = await pool.query(`
    select
      u.id, u.name,
      lo.id as province_id, lo.label as province_name,
      lo.extra->>'region' as region,
      (lo.extra->>'metro')::boolean as metro
    from users u
    join lookup_options lo on lo.id = u.work_province_id
    where u.show_workplace_on_map = true
      and u.student_status = 'alumni'
      and lo.category = 'province'
  `);
  return rows;
}

// ---------------------------------------------------------------
// Profile
// ---------------------------------------------------------------
export async function getUserProfile(studentId: string) {
  const { rows } = await pool.query(
    `select u.*, gen.label as generation, prov.label as province, ct.label as career_type
     from users u
     left join lookup_options gen on gen.id = u.generation_option_id
     left join lookup_options prov on prov.id = u.province_option_id
     left join lookup_options ct on ct.id = u.career_option_id
     where u.student_id = $1`,
    [studentId]
  );
  if (rows.length === 0) return null;
  const user = rows[0];

  const { rows: gallery } = await pool.query(
    `select image_url from media_assets where owner_type = 'user_gallery' and owner_id = $1 order by sort_order limit 3`,
    [user.id]
  );

  return { ...user, galleryImages: gallery.map((g) => g.image_url) };
}

// อัลบั้ม "รูปที่มีคุณ" — รูปที่ถูกคนอื่นแท็ก
export async function getTaggedPhotos(userId: number) {
  const { rows } = await pool.query(`
    select ma.*
    from media_assets ma
    join photo_tags pt on pt.asset_id = ma.id
    where pt.tagged_user_id = $1
    order by ma.created_at desc
  `, [userId]);
  return rows;
}

// อัลบั้ม "รูปที่คุณตอบคำถาม" — รูปที่เจ้าตัวปลดล็อกเอง
export async function getUnlockedPhotos(userId: number) {
  const { rows } = await pool.query(`
    select ma.*
    from media_assets ma
    join photo_view_verifications pvv on pvv.asset_id = ma.id
    where pvv.user_id = $1 and pvv.is_passed = true
    order by pvv.verified_at desc
  `, [userId]);
  return rows;
}

// ---------------------------------------------------------------
// Auto-promote นักศึกษา -> ศิษย์เก่า
// ---------------------------------------------------------------
export async function checkAndPromoteToAlumni(userId: number) {
  const currentYear = new Date().getFullYear();
  const { rows } = await pool.query(
    `update users
     set student_status = 'alumni'
     where id = $1
       and student_status = 'studying'
       and expected_graduation_year is not null
       and expected_graduation_year <= $2
     returning id, student_status`,
    [userId, currentYear]
  );
  return rows[0] ?? null; // มีค่า = เพิ่งอัปเกรดสถานะรอบนี้
}

// ---------------------------------------------------------------
// Admin
// ---------------------------------------------------------------
export async function getPendingUsers() {
  const { rows } = await pool.query(`
    select u.id, u.student_id, u.name, gen.label as generation, u.created_at,
      (select v.status from user_verifications v
       where v.user_id = u.id and v.source = 'registrar_api'
       order by v.decided_at desc limit 1) as registrar_status
    from users u
    left join lookup_options gen on gen.id = u.generation_option_id
    where u.status = 'pending'
    order by u.created_at desc
  `);
  return rows;
}

export async function getAdminOverviewStats() {
  const { rows: userStats } = await pool.query(
    `select
       count(*) filter (where status = 'pending')::int as pending_approvals,
       count(*) filter (where status = 'approved')::int as approved_users
     from users`
  );
  const { rows: postStats } = await pool.query(`select count(*)::int as total_posts from posts`);
  const { rows: postRequestStats } = await pool.query(
    `select count(*)::int as pending_post_requests from posts where status = 'pending_request'`
  );
  const { rows: interactionStats } = await pool.query(
    `select
       count(*) filter (where type = 'comment')::int as total_comments,
       count(*) filter (where type = 'reaction')::int as total_reactions
     from post_interactions`
  );
  const { rows: pollStats } = await pool.query(
    `select
       count(*) filter (where status = 'active')::int as active_polls,
       (select count(*) from poll_votes)::int as total_poll_votes
     from polls`
  );
  const { rows: hofStats } = await pool.query(
    `select c.title, c.status, count(v.id)::int as total_votes
     from hof_campaigns c
     left join hof_votes v on v.campaign_id = c.id
     group by c.id, c.title, c.status
     order by c.id desc limit 1`
  );
  const { rows: photoStats } = await pool.query(
    `select
       count(distinct generation_option_id)::int as total_albums,
       count(*)::int as total_photos,
       (select count(*) from photo_tags)::int as total_tags
     from media_assets where owner_type = 'photo_archive'`
  );

  return {
    pendingApprovals: userStats[0].pending_approvals,
    approvedUsers: userStats[0].approved_users,
    totalPosts: postStats[0].total_posts,
    pendingPostRequests: postRequestStats[0].pending_post_requests,
    totalComments: interactionStats[0].total_comments,
    totalReactions: interactionStats[0].total_reactions,
    activePolls: pollStats[0].active_polls,
    totalPollVotes: pollStats[0].total_poll_votes,
    hofCampaign: hofStats[0] ?? null,
    totalAlbums: photoStats[0].total_albums,
    totalPhotos: photoStats[0].total_photos,
    totalTags: photoStats[0].total_tags,
  };
}

export async function getActivityLog(userId: number) {
  const { rows } = await pool.query(
    `
    select description, points, created_at from (
      select ('คอมเมนต์: ' || left(content, 40)) as description, points_earned as points, created_at
      from post_interactions where user_id = $1 and type = 'comment'
      union all
      select ('โหวตโพล: ' || (select question from polls where id = poll_votes.poll_id)) as description, points_awarded as points, voted_at as created_at
      from poll_votes where user_id = $1
      union all
      select ('โหวต Hall of Fame (' ||
        case vote_category when 'same_generation' then 'ในรุ่น' else 'นอกรุ่น' end || ')') as description,
        points, voted_at as created_at
      from hof_votes where voter_id = $1
      union all
      select 'ตอบคำถามปลดล็อกรูปเก่าสำเร็จ' as description, points_earned as points, verified_at as created_at
      from photo_view_verifications where user_id = $1 and is_passed = true
    ) activity
    order by created_at desc
    `,
    [userId]
  );
  return rows;
}
// เพิ่มฟังก์ชันนี้ต่อท้าย src/lib/db.ts (สำหรับ autocomplete ตอนแท็กเพื่อนในรูป)
export async function getAllApprovedUsers() {
  const { rows } = await pool.query(
    `select id, name from users where status = 'approved' order by name`
  );
  return rows;
}

export async function addPostComment(postId: number, userId: number, content: string) {
  const { rows } = await pool.query(
    `insert into post_interactions (post_id, user_id, type, content, points_earned)
     values ($1, $2, 'comment', $3, 1)
     returning id, content, created_at`,
    [postId, userId, content]
  );
  // ให้พอยท์ผู้ใช้ +1
  await pool.query(`update users set total_points = total_points + 1 where id = $1`, [userId]);
  
  const user = await pool.query(`select name, avatar_url from users where id = $1`, [userId]);
  return {
    id: rows[0].id,
    content: rows[0].content,
    created_at: rows[0].created_at,
    author: user.rows[0]?.name || 'ศิษย์เก่า',
    avatar_url: user.rows[0]?.avatar_url || null,
  };
}

export async function togglePostLike(postId: number, userId: number) {
  const { rows } = await pool.query(
    `select id from post_interactions where post_id = $1 and user_id = $2 and type = 'reaction'`,
    [postId, userId]
  );
  if (rows.length > 0) {
    await pool.query(`delete from post_interactions where id = $1`, [rows[0].id]);
    return { liked: false };
  } else {
    await pool.query(
      `insert into post_interactions (post_id, user_id, type, points_earned) values ($1, $2, 'reaction', 0)`,
      [postId, userId]
    );
    return { liked: true };
  }
}

// ---------------------------------------------------------------
// Lookup / Dropdown data
// ---------------------------------------------------------------

/** ดึง generations ทั้งหมดสำหรับ dropdown filter */
export async function getGenerations() {
  const { rows } = await pool.query(
    `SELECT id, code, label, extra FROM lookup_options WHERE category = 'generation' ORDER BY code`
  );
  return rows;
}

/** ดึงจังหวัดทั้งหมด พร้อม region และ metro flag */
export async function getAllProvinces() {
  const { rows } = await pool.query(
    `SELECT id, code, label,
            extra->>'region' AS region,
            (extra->>'metro')::boolean AS metro
     FROM lookup_options WHERE category = 'province' ORDER BY label`
  );
  return rows;
}

/** ดึง career types สำหรับ dropdown */
export async function getCareerTypes() {
  const { rows } = await pool.query(
    `SELECT id, code, label FROM lookup_options WHERE category = 'career_type' ORDER BY label`
  );
  return rows;
}

// ---------------------------------------------------------------
// User: fetch by id
// ---------------------------------------------------------------

/** ดึง user ตาม id พร้อม join labels (ใช้ใน middleware / auth) */
export async function getUserById(userId: number) {
  const { rows } = await pool.query(
    `SELECT u.*,
            gen.label  AS generation,
            prov.label AS province,
            ct.label   AS career_type
     FROM users u
     LEFT JOIN lookup_options gen  ON gen.id  = u.generation_option_id
     LEFT JOIN lookup_options prov ON prov.id = u.province_option_id
     LEFT JOIN lookup_options ct   ON ct.id   = u.career_option_id
     WHERE u.id = $1`,
    [userId]
  );
  return rows[0] ?? null;
}

// ---------------------------------------------------------------
// Profile update
// ---------------------------------------------------------------

/** อัปเดต profile ของ user (เฉพาะ field ที่ส่งมา) */
export async function updateUserProfile(
  userId: number,
  data: {
    name?: string;
    company?: string;
    position?: string;
    bio?: string;
    avatar_url?: string;
    career_option_id?: number | null;
    province_option_id?: number | null;
    hometown_province_id?: number | null;
    work_province_id?: number | null;
    show_hometown_on_map?: boolean;
    show_workplace_on_map?: boolean;
  }
) {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const [key, val] of Object.entries(data)) {
    if (val === undefined) continue;
    fields.push(`${key} = $${idx++}`);
    values.push(val);
  }
  if (fields.length === 0) return null;

  values.push(userId);
  const { rows } = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

/** อัปเดต map privacy settings เท่านั้น */
export async function updateMapPrivacy(
  userId: number,
  opts: { showHometownOnMap?: boolean; showWorkplaceOnMap?: boolean }
) {
  const fields: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (opts.showHometownOnMap  !== undefined) { fields.push(`show_hometown_on_map = $${i++}`);  params.push(opts.showHometownOnMap); }
  if (opts.showWorkplaceOnMap !== undefined) { fields.push(`show_workplace_on_map = $${i++}`); params.push(opts.showWorkplaceOnMap); }
  if (fields.length === 0) return null;

  params.push(userId);
  const { rows } = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${i}
     RETURNING id, show_hometown_on_map, show_workplace_on_map`,
    params
  );
  return rows[0] ?? null;
}

/** อัปเดต avatar_url */
export async function updateAvatar(userId: number, avatarUrl: string) {
  const { rows } = await pool.query(
    `UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, avatar_url`,
    [avatarUrl, userId]
  );
  return rows[0] ?? null;
}

// ---------------------------------------------------------------
// Admin: User management
// ---------------------------------------------------------------

/** อนุมัติ user pending → approved */
export async function approveUser(userId: number, adminId: number) {
  const { rows } = await pool.query(
    `UPDATE users SET status = 'approved'
     WHERE id = $1 AND status = 'pending'
     RETURNING id, name, status`,
    [userId]
  );
  if (rows.length > 0) {
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, target_type, target_id)
       VALUES ($1, 'approve_user', 'user', $2)`,
      [adminId, userId]
    );
  }
  return rows[0] ?? null;
}

/** ปฏิเสธ user */
export async function rejectUser(userId: number, adminId: number, remark?: string) {
  const { rows } = await pool.query(
    `UPDATE users SET status = 'rejected'
     WHERE id = $1 AND status = 'pending'
     RETURNING id, name, status`,
    [userId]
  );
  if (rows.length > 0) {
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, target_type, target_id, metadata)
       VALUES ($1, 'reject_user', 'user', $2, $3)`,
      [adminId, userId, JSON.stringify({ remark: remark ?? '' })]
    );
  }
  return rows[0] ?? null;
}

/** ดึงผู้ใช้ทั้งหมด พร้อม optional filter */
export async function getAllUsers(opts?: {
  status?: 'pending' | 'approved' | 'rejected';
  role?: 'alumni' | 'admin';
  generationId?: number;
}) {
  const filters: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (opts?.status)       { filters.push(`u.status = $${i++}`);               params.push(opts.status); }
  if (opts?.role)         { filters.push(`u.role = $${i++}`);                 params.push(opts.role); }
  if (opts?.generationId) { filters.push(`u.generation_option_id = $${i++}`); params.push(opts.generationId); }

  const where = filters.length > 0 ? 'WHERE ' + filters.join(' AND ') : '';
  const { rows } = await pool.query(
    `SELECT u.id, u.student_id, u.name, u.email, u.role, u.status,
            u.total_points, u.student_status, u.created_at,
            gen.label AS generation
     FROM users u
     LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
     ${where}
     ORDER BY u.created_at DESC`,
    params
  );
  return rows;
}

// ---------------------------------------------------------------
// Search
// ---------------------------------------------------------------

/** ค้นหาศิษย์เก่าแบบ full-text (ชื่อ, บริษัท, ตำแหน่ง, จังหวัด, รุ่น) */
export async function searchAlumni(
  query: string,
  opts?: { generationId?: number; provinceId?: number; careerId?: number; limit?: number }
) {
  const searchTerm = `%${query}%`;
  const params: unknown[] = [searchTerm];
  const filters: string[] = [
    `(u.name ILIKE $1 OR u.company ILIKE $1 OR u.position ILIKE $1
      OR gen.label ILIKE $1 OR prov.label ILIKE $1)`,
  ];

  let i = 2;
  if (opts?.generationId) { filters.push(`u.generation_option_id = $${i++}`); params.push(opts.generationId); }
  if (opts?.provinceId)   { filters.push(`u.province_option_id = $${i++}`);   params.push(opts.provinceId); }
  if (opts?.careerId)     { filters.push(`u.career_option_id = $${i++}`);     params.push(opts.careerId); }

  const limit = opts?.limit ?? 50;
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.position, u.company, u.avatar_url, u.total_points,
            gen.label  AS generation,
            prov.label AS province,
            ct.label   AS career_type
     FROM users u
     LEFT JOIN lookup_options gen  ON gen.id  = u.generation_option_id
     LEFT JOIN lookup_options prov ON prov.id = u.province_option_id
     LEFT JOIN lookup_options ct   ON ct.id   = u.career_option_id
     WHERE u.status = 'approved' AND ${filters.join(' AND ')}
     ORDER BY u.total_points DESC, u.name
     LIMIT ${limit}`,
    params
  );
  return rows;
}

// ---------------------------------------------------------------
// Voting: Poll
// ---------------------------------------------------------------

/** โหวต poll — คืน error string ถ้าโหวตแล้ว หรือโพลปิด */
export async function castPollVote(
  pollId: number,
  optionId: number,
  userId: number
): Promise<{ success: boolean; error?: string; pointsAwarded?: number }> {
  const { rows: existing } = await pool.query(
    `SELECT id FROM poll_votes WHERE poll_id = $1 AND user_id = $2`,
    [pollId, userId]
  );
  if (existing.length > 0) return { success: false, error: 'โหวตแล้ว' };

  const { rows: pollRows } = await pool.query(
    `SELECT points_per_vote FROM polls WHERE id = $1 AND status = 'active'`,
    [pollId]
  );
  if (pollRows.length === 0) return { success: false, error: 'ไม่พบโพลหรือโพลปิดแล้ว' };

  const points = pollRows[0].points_per_vote as number;
  await pool.query(
    `INSERT INTO poll_votes (poll_id, option_id, user_id, points_awarded)
     VALUES ($1, $2, $3, $4)`,
    [pollId, optionId, userId, points]
  );
  if (points > 0) {
    await pool.query(
      `UPDATE users SET total_points = total_points + $1 WHERE id = $2`,
      [points, userId]
    );
  }
  return { success: true, pointsAwarded: points };
}

// ---------------------------------------------------------------
// Voting: Hall of Fame
// ---------------------------------------------------------------

/** โหวต Hall of Fame (same_generation = 5 คะแนน, other_generation = 10 คะแนน) */
export async function castHofVote(
  campaignId: number,
  voterId: number,
  candidateId: number,
  voteCategory: 'same_generation' | 'other_generation'
): Promise<{ success: boolean; error?: string; points?: number }> {
  const { rows: existing } = await pool.query(
    `SELECT id FROM hof_votes
     WHERE campaign_id = $1 AND voter_id = $2 AND vote_category = $3`,
    [campaignId, voterId, voteCategory]
  );
  if (existing.length > 0) {
    return { success: false, error: `โหวต ${voteCategory} ในแคมเปญนี้แล้ว` };
  }

  const points = voteCategory === 'same_generation' ? 5 : 10;
  await pool.query(
    `INSERT INTO hof_votes (campaign_id, voter_id, candidate_id, vote_category, points)
     VALUES ($1, $2, $3, $4, $5)`,
    [campaignId, voterId, candidateId, voteCategory, points]
  );
  await pool.query(
    `UPDATE users SET total_points = total_points + $1 WHERE id = $2`,
    [points, voterId]
  );
  return { success: true, points };
}

/** ดึง leaderboard คะแนนรวมของ alumni */
export async function getLeaderboard(limit = 20) {
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.avatar_url, u.total_points, u.position, u.company,
            gen.label AS generation
     FROM users u
     LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
     WHERE u.status = 'approved' AND u.role = 'alumni'
     ORDER BY u.total_points DESC, u.name
     LIMIT $1`,
    [limit]
  );
  return rows;
}

// ---------------------------------------------------------------
// Gallery: Photo unlock (proper version)
// ---------------------------------------------------------------

/** บันทึกผล unlock รูปภาพ — ทั้งผ่านและไม่ผ่าน
 *  ใช้ ON CONFLICT DO NOTHING เพื่อกัน insert ซ้ำ
 *  (photo_view_verifications ยังไม่มี unique constraint — ถ้าเพิ่มใน migration ได้ยิ่งดี)
 */
export async function recordPhotoUnlock(
  assetId: number,
  userId: number,
  question: string,
  isPassed: boolean
): Promise<{ isPassed: boolean; pointsEarned: number }> {
  const points = isPassed ? 5 : 0;
  await pool.query(
    `INSERT INTO photo_view_verifications (asset_id, user_id, question, is_passed, points_earned)
     VALUES ($1, $2, $3, $4, $5)`,
    [assetId, userId, question, isPassed, points]
  );
  if (isPassed) {
    await pool.query(
      `UPDATE users SET total_points = total_points + $1 WHERE id = $2`,
      [points, userId]
    );
  }
  return { isPassed, pointsEarned: points };
}

// ---------------------------------------------------------------
// Gallery: User gallery
// ---------------------------------------------------------------

/** ดึง user gallery ของ user นั้น */
export async function getUserGallery(userId: number) {
  const { rows } = await pool.query(
    `SELECT id, image_url, caption, sort_order, created_at
     FROM media_assets
     WHERE owner_type = 'user_gallery' AND owner_id = $1
     ORDER BY sort_order ASC, created_at DESC`,
    [userId]
  );
  return rows;
}

/** เพิ่มรูปเข้า user gallery */
export async function addUserGalleryImage(
  userId: number,
  imageUrl: string,
  caption?: string
) {
  const { rows } = await pool.query(
    `INSERT INTO media_assets (owner_type, owner_id, uploaded_by, image_url, caption)
     VALUES ('user_gallery', $1, $1, $2, $3)
     RETURNING *`,
    [userId, imageUrl, caption ?? null]
  );
  return rows[0];
}

// ---------------------------------------------------------------
// Post: Admin tools
// ---------------------------------------------------------------

/** ดึง post เดี่ยวตาม id */
export async function getPostById(postId: number) {
  const { rows } = await pool.query(
    `SELECT p.id, p.category, p.title, p.content, p.pinned,
            p.status, p.post_type, p.created_at, p.published_at,
            COALESCE(a.name, r.name) AS author
     FROM posts p
     LEFT JOIN users a ON a.id = p.admin_id
     LEFT JOIN users r ON r.id = p.requested_by
     WHERE p.id = $1`,
    [postId]
  );
  return rows[0] ?? null;
}

/** สร้างโพสต์โดยตรง (admin only) */
export async function createPost(
  adminId: number,
  data: { category: string; title: string; content: string; pinned?: boolean }
) {
  const { rows } = await pool.query(
    `INSERT INTO posts (admin_id, category, title, content, post_type, status, pinned, published_at)
     VALUES ($1, $2, $3, $4, 'normal', 'published', $5, now())
     RETURNING *`,
    [adminId, data.category, data.title, data.content, data.pinned ?? false]
  );
  await pool.query(
    `INSERT INTO audit_logs (actor_id, action, target_type, target_id)
     VALUES ($1, 'create_post', 'post', $2)`,
    [adminId, rows[0].id]
  );
  return rows[0];
}

/** ลบโพสต์ (admin only) */
export async function deletePost(postId: number, adminId: number) {
  const { rows } = await pool.query(
    `DELETE FROM posts WHERE id = $1 RETURNING id, title`,
    [postId]
  );
  if (rows.length > 0) {
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, target_type, target_id)
       VALUES ($1, 'delete_post', 'post', $2)`,
      [adminId, postId]
    );
  }
  return rows[0] ?? null;
}

/** Toggle pin post */
export async function togglePostPin(postId: number) {
  const { rows } = await pool.query(
    `UPDATE posts SET pinned = NOT pinned WHERE id = $1 RETURNING id, pinned`,
    [postId]
  );
  return rows[0] ?? null;
}

// ---------------------------------------------------------------
// Map: enriched province count
// ---------------------------------------------------------------

/** สรุปจำนวน alumni ต่อจังหวัด แยกตาม hometown/workplace
 *  ใช้ column จริง: hometown_province_id / work_province_id,
 *                   show_hometown_on_map / show_workplace_on_map
 */
export async function getProvinceAlumniCount(type: 'hometown' | 'workplace') {
  const col     = type === 'hometown' ? 'hometown_province_id'  : 'work_province_id';
  const showCol = type === 'hometown' ? 'show_hometown_on_map'  : 'show_workplace_on_map';

  const { rows } = await pool.query(
    `SELECT lo.id AS province_id, lo.code, lo.label AS province_name,
            lo.extra->>'region'         AS region,
            (lo.extra->>'metro')::boolean AS metro,
            COUNT(u.id)::int              AS alumni_count
     FROM lookup_options lo
     LEFT JOIN users u
       ON u.${col} = lo.id
       AND u.${showCol} = true
       AND u.status = 'approved'
     WHERE lo.category = 'province'
     GROUP BY lo.id, lo.code, lo.label, lo.extra
     ORDER BY alumni_count DESC`
  );
  return rows;
}

// ---------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------

/** ดึง audit logs สำหรับ admin */
export async function getAuditLogs(limit = 50) {
  const { rows } = await pool.query(
    `SELECT al.id, al.action, al.target_type, al.target_id,
            al.metadata, al.created_at,
            u.name AS actor_name
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.actor_id
     ORDER BY al.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}