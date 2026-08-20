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