import { pool } from '@/lib/db';

/**
 * สถิติภาพรวมสำหรับแท็บ "สถิติ" ในหน้าจัดการระบบ (แอดมินเท่านั้น — ดู /api/admin/stats)
 * นับจากข้อมูลจริงใน DB ทั้งหมด ไม่นับบัญชีแอดมินเป็นสมาชิก
 */

export interface CountItem {
  label: string;
  count: number;
}

export interface AdminStats {
  generatedAt: string;
  members: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    alumni: number;
    studying: number;
    mentors: number;
    inYearbook: number;
    newLast30Days: number;
    /** ผู้ใช้ active จาก users.last_active_at (อัปเดตทุกครั้งที่ใช้งาน ไม่เกิน 5 นาทีครั้ง) */
    activeNow: number;
    activeToday: number;
    active7Days: number;
    activeLast30Days: number;
    generationLeaders: number;
  };
  signupsByMonth: CountItem[];
  byGeneration: CountItem[];
  hometownProvinces: CountItem[];
  workLocations: CountItem[];
  careerTypes: CountItem[];
  topCompanies: CountItem[];
  engagement: {
    publishedPosts: number;
    pendingPostRequests: number;
    comments: number;
    postReactions: number;
    commentReactions: number;
    pollVotes: number;
    yearbookLikes: number;
    hofVotesCurrentCampaign: number;
    photos: number;
    postsLast30Days: number;
    commentsLast30Days: number;
  };
  topContributors: { id: number; name: string; generation: string | null; points: number }[];
  moderation: {
    pendingReports: number;
    hiddenPosts: number;
    hiddenComments: number;
    bannedKeywords: number;
  };
}

// สมาชิกที่นับในสถิติ = อนุมัติแล้ว และไม่ใช่แอดมิน
const MEMBER = `u.role <> 'admin' AND u.status = 'approved'`;

async function count(sql: string, params: unknown[] = []): Promise<number> {
  const { rows } = await pool.query(sql, params);
  return Number(rows[0]?.count ?? 0);
}

/** ตารางที่ migration ใหม่สร้าง (เช่น comment_reactions) อาจยังไม่มีในเครื่องที่ยังไม่รัน migrate — นับเป็น 0 */
async function countIfTableExists(table: string, sql: string): Promise<number> {
  const { rows } = await pool.query(`SELECT to_regclass($1) IS NOT NULL AS ok`, [table]);
  return rows[0]?.ok ? count(sql) : 0;
}

async function countItems(sql: string): Promise<CountItem[]> {
  const { rows } = await pool.query(sql);
  return rows.map((r) => ({ label: String(r.label), count: Number(r.count) }));
}

/**
 * ผู้ใช้ active (ไม่นับแอดมิน)
 * - ออนไลน์ตอนนี้: ใช้งานภายใน 10 นาที (last_active_at อัปเดตไม่เกิน 5 นาทีครั้ง)
 * - วันนี้: ตั้งแต่เที่ยงคืนเวลาไทย
 * ถ้ายังไม่ได้รัน migration (ไม่มี last_active_at) ใช้จำนวนคนที่ล็อกอินใน 30 วันจาก sessions แทน
 */
async function getActiveUsers() {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE last_active_at >= now() - interval '10 minutes')::int AS now,
        COUNT(*) FILTER (WHERE last_active_at >= (date_trunc('day', now() AT TIME ZONE 'Asia/Bangkok') AT TIME ZONE 'Asia/Bangkok'))::int AS today,
        COUNT(*) FILTER (WHERE last_active_at >= now() - interval '7 days')::int AS d7,
        COUNT(*) FILTER (WHERE last_active_at >= now() - interval '30 days')::int AS d30
      FROM users WHERE role <> 'admin'
    `);
    const r = rows[0];
    return { activeNow: r.now, activeToday: r.today, active7Days: r.d7, activeLast30Days: r.d30 };
  } catch {
    const d30 = await count(`
      SELECT COUNT(DISTINCT s.user_id) AS count
      FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE u.role <> 'admin' AND s.created_at >= now() - interval '30 days'
    `);
    return { activeNow: 0, activeToday: 0, active7Days: 0, activeLast30Days: d30 };
  }
}

export class AdminStatsService {
  async getStats(): Promise<AdminStats> {
    const [
      members,
      activeUsers,
      signupsByMonth,
      byGeneration,
      hometownProvinces,
      workLocations,
      careerTypes,
      topCompanies,
      engagementRow,
      commentReactions,
      yearbookLikes,
      bannedKeywords,
      pendingReports,
      topContributors,
    ] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE u.role <> 'admin')::int AS total,
          COUNT(*) FILTER (WHERE ${MEMBER})::int AS approved,
          COUNT(*) FILTER (WHERE u.role <> 'admin' AND u.status = 'pending')::int AS pending,
          COUNT(*) FILTER (WHERE u.role <> 'admin' AND u.status = 'rejected')::int AS rejected,
          COUNT(*) FILTER (WHERE ${MEMBER} AND u.student_status = 'alumni')::int AS alumni,
          COUNT(*) FILTER (WHERE ${MEMBER} AND u.student_status = 'studying')::int AS studying,
          COUNT(*) FILTER (WHERE ${MEMBER} AND u.is_available_for_mentorship)::int AS mentors,
          COUNT(*) FILTER (WHERE ${MEMBER} AND u.yearbook_published)::int AS in_yearbook,
          COUNT(*) FILTER (WHERE u.role <> 'admin' AND u.created_at >= now() - interval '30 days')::int AS new_30
        FROM users u
      `),
      getActiveUsers(),
      // สมัครรายเดือน 12 เดือนล่าสุด (รวมเดือนที่ไม่มีคนสมัครเป็น 0)
      countItems(`
        SELECT to_char(m.month, 'YYYY-MM') AS label, COUNT(u.id) AS count
        FROM generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') AS m(month)
        LEFT JOIN users u ON u.role <> 'admin' AND date_trunc('month', u.created_at) = m.month
        GROUP BY m.month ORDER BY m.month
      `),
      // จำนวนสมาชิกต่อรุ่น เรียงตามเลขรุ่น (ข้อมูลเชิงลำดับ ไม่ใช่จัดอันดับ)
      countItems(`
        SELECT g.label, COUNT(*) AS count
        FROM users u JOIN lookup_options g ON g.id = u.generation_option_id
        WHERE ${MEMBER}
        GROUP BY g.label, g.extra
        ORDER BY COALESCE((g.extra->>'gen_number')::int, 0)
      `),
      countItems(`
        SELECT p.label, COUNT(*) AS count
        FROM users u JOIN lookup_options p ON p.id = u.province_option_id
        WHERE ${MEMBER}
        GROUP BY p.label ORDER BY count DESC, p.label LIMIT 8
      `),
      countItems(`
        SELECT p.label, COUNT(*) AS count
        FROM users u JOIN lookup_options p ON p.id = u.work_province_id
        WHERE ${MEMBER}
        GROUP BY p.label ORDER BY count DESC, p.label LIMIT 8
      `),
      countItems(`
        SELECT c.label, COUNT(*) AS count
        FROM users u JOIN lookup_options c ON c.id = u.career_option_id
        WHERE ${MEMBER} AND (u.company IS NOT NULL OR u.position IS NOT NULL)
        GROUP BY c.label ORDER BY count DESC, c.label
      `),
      countItems(`
        SELECT btrim(u.company) AS label, COUNT(*) AS count
        FROM users u
        WHERE ${MEMBER} AND btrim(coalesce(u.company, '')) <> ''
        GROUP BY btrim(u.company) ORDER BY count DESC, label LIMIT 5
      `),
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM posts WHERE status IN ('published', 'approved'))::int AS published_posts,
          (SELECT COUNT(*) FROM posts WHERE status IN ('pending', 'pending_request'))::int AS pending_post_requests,
          (SELECT COUNT(*) FROM post_interactions WHERE type = 'comment')::int AS comments,
          (SELECT COUNT(*) FROM post_interactions WHERE type IN ('reaction', 'like'))::int AS post_reactions,
          (SELECT COUNT(*) FROM poll_votes)::int AS poll_votes,
          (SELECT COUNT(*) FROM hof_votes
            WHERE campaign_id = (SELECT id FROM hof_campaigns ORDER BY id DESC LIMIT 1))::int AS hof_votes,
          (SELECT COUNT(*) FROM media_assets)::int AS photos,
          (SELECT COUNT(*) FROM posts WHERE created_at >= now() - interval '30 days')::int AS posts_30,
          (SELECT COUNT(*) FROM post_interactions
            WHERE type = 'comment' AND created_at >= now() - interval '30 days')::int AS comments_30,
          (SELECT COUNT(*) FROM posts WHERE is_hidden)::int AS hidden_posts,
          (SELECT COUNT(*) FROM post_interactions WHERE type = 'comment' AND is_hidden)::int AS hidden_comments
      `),
      countIfTableExists('comment_reactions', `SELECT COUNT(*) AS count FROM comment_reactions`),
      countIfTableExists('yearbook_likes', `SELECT COUNT(*) AS count FROM yearbook_likes`),
      countIfTableExists('banned_keywords', `SELECT COUNT(*) AS count FROM banned_keywords`),
      countIfTableExists('content_reports', `SELECT COUNT(*) AS count FROM content_reports WHERE status = 'pending'`),
      pool.query(`
        SELECT u.id, u.name, g.label AS generation, u.total_points AS points
        FROM users u LEFT JOIN lookup_options g ON g.id = u.generation_option_id
        WHERE ${MEMBER} AND u.total_points > 0
        ORDER BY u.total_points DESC, u.name LIMIT 5
      `),
    ]);

    const m = members.rows[0];
    const generationLeaders = await countIfTableExists('generation_leaders', `SELECT COUNT(*) AS count FROM generation_leaders`);
    const e = engagementRow.rows[0];
    return {
      generatedAt: new Date().toISOString(),
      members: {
        total: m.total,
        approved: m.approved,
        pending: m.pending,
        rejected: m.rejected,
        alumni: m.alumni,
        studying: m.studying,
        mentors: m.mentors,
        inYearbook: m.in_yearbook,
        newLast30Days: m.new_30,
        ...activeUsers,
        generationLeaders,
      },
      signupsByMonth,
      byGeneration,
      hometownProvinces,
      workLocations,
      careerTypes,
      topCompanies,
      engagement: {
        publishedPosts: e.published_posts,
        pendingPostRequests: e.pending_post_requests,
        comments: e.comments,
        postReactions: e.post_reactions,
        commentReactions,
        pollVotes: e.poll_votes,
        yearbookLikes,
        hofVotesCurrentCampaign: e.hof_votes,
        photos: e.photos,
        postsLast30Days: e.posts_30,
        commentsLast30Days: e.comments_30,
      },
      topContributors: topContributors.rows.map((r) => ({
        id: r.id,
        name: r.name,
        generation: r.generation,
        points: r.points,
      })),
      moderation: {
        pendingReports,
        hiddenPosts: e.hidden_posts,
        hiddenComments: e.hidden_comments,
        bannedKeywords,
      },
    };
  }
}

export const adminStatsService = new AdminStatsService();
