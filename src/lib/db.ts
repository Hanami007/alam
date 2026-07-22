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

// ---------------------------------------------------------------
// Feed: posts + polls + interactions
// ---------------------------------------------------------------
export async function getFeedPosts() {
  const { rows: posts } = await pool.query(`
    select p.id, p.category, p.title, p.content as body, p.pinned, p.created_at,
           u.name as author
    from posts p
    join users u on u.id = p.admin_id
    order by p.created_at desc
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

    postsWithExtras.push({
      ...post,
      likes: counts[0].likes,
      comments: counts[0].comments,
      commentPoints: 1,
      poll,
    });
  }
  return postsWithExtras;
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