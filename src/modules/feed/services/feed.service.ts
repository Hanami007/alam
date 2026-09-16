import { pool } from '@/lib/db';

export interface FeedComment {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  author: string;
  content: string;
  createdAt: string;
  created_at: string;
  isAvailableForMentorship?: boolean;
}

export interface FeedPollOption {
  id: number;
  text: string;
  votes: number;
  voteCount: number;
}

export interface FeedPoll {
  id: number;
  question: string;
  pointsPerVote: number;
  options: FeedPollOption[];
  hasVoted?: boolean;
  userVotedOptionId?: number;
  votedUserIds?: number[];
  userVotes?: { user_id: number; option_id: number }[];
}

export interface FeedPostItem {
  id: number;
  category: string;
  title: string;
  body: string;
  author: string;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  authorRole: string;
  pinned: boolean;
  createdAt: string;
  created_at: string;
  imageUrl?: string;
  likes: number;
  likeCount: number;
  comments: number;
  commentCount: number;
  isLiked?: boolean;
  isAvailableForMentorship?: boolean;
  commentsList: FeedComment[];
  poll?: FeedPoll;
}

export class FeedDbService {
  /**
   * ดึงรายการโพสต์ทั้งหมดพร้อม Polls, Comments, และ Likes
   */
  async getPosts(currentUserId?: number): Promise<FeedPostItem[]> {
    try {
      const { rows: posts } = await pool.query(`
        SELECT
          p.id, p.category, p.title, p.content as body, p.pinned, p.created_at, p.status,
          COALESCE(admin.id, req.id, 1) as author_id,
          COALESCE(admin.name, req.name, 'ผู้ดูแลระบบ') as author_name,
          COALESCE(admin.avatar_url, req.avatar_url) as author_avatar,
          COALESCE(admin.role, req.role, 'admin') as author_role,
          COALESCE(admin.is_available_for_mentorship, req.is_available_for_mentorship, false) as is_available_for_mentorship,
          COALESCE(like_stat.like_count, 0)::int as like_count,
          COALESCE(comment_stat.comment_count, 0)::int as comment_count,
          ${currentUserId ? `EXISTS(SELECT 1 FROM post_interactions WHERE post_id = p.id AND user_id = ${Number(currentUserId)} AND type = 'reaction') as is_liked` : 'false as is_liked'}
        FROM posts p
        LEFT JOIN users admin ON admin.id = p.admin_id
        LEFT JOIN users req ON req.id = p.requested_by
        LEFT JOIN (
          SELECT post_id, COUNT(*) as like_count
          FROM post_interactions
          WHERE type = 'reaction'
          GROUP BY post_id
        ) like_stat ON like_stat.post_id = p.id
        LEFT JOIN (
          SELECT post_id, COUNT(*) as comment_count
          FROM post_interactions
          WHERE type = 'comment'
          GROUP BY post_id
        ) comment_stat ON comment_stat.post_id = p.id
        WHERE p.status IN ('published', 'approved')
        ORDER BY p.pinned DESC, COALESCE(p.published_at, p.created_at) DESC, p.created_at DESC
        LIMIT 50
      `);

      const postIds = posts.map((p) => p.id);
      if (postIds.length === 0) return [];

      const { rows: comments } = await pool.query(
        `SELECT pi.id, pi.post_id, pi.user_id, pi.content, pi.created_at,
                u.name as user_name, u.avatar_url as user_avatar, u.is_available_for_mentorship
         FROM post_interactions pi
         JOIN users u ON u.id = pi.user_id
         WHERE pi.post_id = ANY($1::int[]) AND pi.type = 'comment'
         ORDER BY pi.created_at ASC`,
        [postIds]
      );

      const { rows: polls } = await pool.query(
        `SELECT pl.id, pl.post_id, pl.question, pl.points_per_vote
         FROM polls pl
         WHERE pl.post_id = ANY($1::int[])`,
        [postIds]
      );

      const pollIds = polls.map((pl) => pl.id);
      let pollOptions: any[] = [];
      let allPollVotes: any[] = [];

      if (pollIds.length > 0) {
        const { rows: opts } = await pool.query(
          `SELECT po.id, po.poll_id, po.option_text,
                  COALESCE(COUNT(pv.id), 0)::int as vote_count
           FROM poll_options po
           LEFT JOIN poll_votes pv ON pv.option_id = po.id
           WHERE po.poll_id = ANY($1::int[])
           GROUP BY po.id, po.poll_id, po.option_text
           ORDER BY po.id ASC`,
          [pollIds]
        );
        pollOptions = opts;

        const { rows: votes } = await pool.query(
          `SELECT pv.poll_id, pv.option_id, pv.user_id
           FROM poll_votes pv
           WHERE pv.poll_id = ANY($1::int[])`,
          [pollIds]
        );
        allPollVotes = votes;
      }

      return posts.map((p) => {
        const postComments: FeedComment[] = comments
          .filter((c) => c.post_id === p.id)
          .map((c) => ({
            id: c.id,
            userId: c.user_id,
            userName: c.user_name,
            author: c.user_name,
            userAvatar: c.user_avatar,
            content: c.content,
            createdAt: c.created_at,
            created_at: c.created_at,
            isAvailableForMentorship: Boolean(c.is_available_for_mentorship),
          }));

        const poll = polls.find((pl) => pl.post_id === p.id);
        let formattedPoll: FeedPoll | undefined;

        if (poll) {
          const pollVotes = allPollVotes.filter((pv) => pv.poll_id === poll.id);
          const votedUserIds = pollVotes.map((pv) => pv.user_id);
          const userVotes = pollVotes.map((pv) => ({ user_id: pv.user_id, option_id: pv.option_id }));
          const myVote = currentUserId ? pollVotes.find((pv) => pv.user_id === currentUserId) : undefined;

          const options = pollOptions
            .filter((opt) => opt.poll_id === poll.id)
            .map((opt) => ({
              id: opt.id,
              text: opt.option_text,
              votes: opt.vote_count,
              voteCount: opt.vote_count,
            }));

          formattedPoll = {
            id: poll.id,
            question: poll.question,
            pointsPerVote: poll.points_per_vote || 5,
            options,
            hasVoted: Boolean(myVote),
            userVotedOptionId: myVote?.option_id,
            votedUserIds,
            userVotes,
          };
        }

        return {
          id: p.id,
          category: p.category,
          title: p.title,
          body: p.body,
          author: p.author_name,
          authorId: p.author_id,
          authorName: p.author_name,
          authorAvatar: p.author_avatar || undefined,
          authorRole: p.author_role,
          pinned: p.pinned,
          createdAt: p.created_at,
          created_at: p.created_at,
          imageUrl: p.image_url,
          likes: p.like_count || 0,
          likeCount: p.like_count || 0,
          comments: p.comment_count || postComments.length || 0,
          commentCount: p.comment_count || postComments.length || 0,
          isLiked: p.is_liked,
          isAvailableForMentorship: Boolean(p.is_available_for_mentorship),
          commentsList: postComments,
          poll: formattedPoll,
        };
      });
    } catch (err) {
      console.error('[FeedDbService] getPosts error:', err);
      return [];
    }
  }

  /**
   * ดึง post เดี่ยวตาม id
   */
  async getPostById(postId: number) {
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

  /**
   * เพิ่มคอมเมนต์ในโพสต์ (+1 แต้มกิจกรรม)
   */
  async addComment(postId: number, userId: number, content: string) {
    const { rows } = await pool.query(
      `INSERT INTO post_interactions (post_id, user_id, type, content, points_earned)
       VALUES ($1, $2, 'comment', $3, 1)
       RETURNING id, content, created_at`,
      [postId, userId, content]
    );

    await pool.query(`UPDATE users SET total_points = total_points + 1 WHERE id = $1`, [userId]);

    try {
      await pool.query(
        `INSERT INTO point_transactions (user_id, points, reason, reference_id)
         VALUES ($1, 1, 'comment_post', $2)`,
        [userId, String(postId)]
      );
    } catch {}

    const user = await pool.query(`select name, avatar_url from users where id = $1`, [userId]);
    return {
      id: rows[0].id,
      content: rows[0].content,
      created_at: rows[0].created_at,
      author: user.rows[0]?.name || 'ศิษย์เก่า',
      avatar_url: user.rows[0]?.avatar_url || null,
    };
  }

  /**
   * Toggle Like โพสต์
   */
  async toggleLike(postId: number, userId: number) {
    const { rows: existing } = await pool.query(
      `select id from post_interactions where post_id = $1 and user_id = $2 and type in ('reaction', 'like')`,
      [postId, userId]
    );

    if (existing.length > 0) {
      await pool.query(`delete from post_interactions where id = $1`, [existing[0].id]);
      return { liked: false };
    }

    await pool.query(
      `insert into post_interactions (post_id, user_id, type, points_earned) values ($1, $2, 'reaction', 1)`,
      [postId, userId]
    );
    await pool.query(`update users set total_points = total_points + 1 where id = $1`, [userId]);

    try {
      await pool.query(
        `insert into point_transactions (user_id, points, reason, reference_id)
         values ($1, 1, 'like_post', $2)`,
        [userId, String(postId)]
      );
    } catch {}

    return { liked: true, pointsAwarded: 1 };
  }

  /**
   * โหวต Poll — คืน error string ถ้าโหวตแล้ว หรือโพลปิด
   */
  async votePoll(
    pollId: number,
    optionId: number,
    userId: number
  ): Promise<{ success: boolean; error?: string; pointsAwarded?: number }> {
    const { rows: existing } = await pool.query(
      `SELECT id FROM poll_votes WHERE poll_id = $1 AND user_id = $2`,
      [pollId, userId]
    );
    if (existing.length > 0) return { success: false, error: 'คุณได้ร่วมลงคะแนนโหวตในโพลนี้ไปแล้ว' };

    const { rows: pollRows } = await pool.query(
      `SELECT points_per_vote FROM polls WHERE id = $1 AND (status = 'active' OR status IS NULL)`,
      [pollId]
    );
    if (pollRows.length === 0) return { success: false, error: 'ไม่พบโพลหรือโพลปิดแล้ว' };

    const points = (pollRows[0].points_per_vote ?? 5) as number;
    await pool.query(
      `INSERT INTO poll_votes (poll_id, option_id, user_id, points_awarded)
       VALUES ($1, $2, $3, $4)`,
      [pollId, optionId, userId, points]
    );
    if (points > 0) {
      await pool.query(`UPDATE users SET total_points = total_points + $1 WHERE id = $2`, [points, userId]);
      try {
        await pool.query(
          `INSERT INTO point_transactions (user_id, points, reason, reference_id)
           VALUES ($1, $2, 'poll_vote', $3)`,
          [userId, points, String(pollId)]
        );
      } catch {}
    }
    return { success: true, pointsAwarded: points };
  }

  /**
   * สมาชิกส่งคำขอโพสต์ (รองรับโพลแบบสำรวจ) — เผยแพร่ทันที
   */
  async submitPostRequest(
    requestedBy: number,
    title: string,
    content: string,
    category: string,
    postType: 'normal' | 'poll' = 'normal',
    pollData?: { question: string; options: string[]; pointsPerVote?: number }
  ) {
    let validUserId = requestedBy;
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [requestedBy]);
    if (userCheck.rows.length === 0) {
      const fallbackUser = await pool.query('SELECT id FROM users ORDER BY id ASC LIMIT 1');
      validUserId = fallbackUser.rows[0]?.id || 1;
    }

    const { rows } = await pool.query(
      `insert into posts (requested_by, category, title, content, post_type, status, published_at)
       values ($1, $2, $3, $4, $5, 'published', now())
       returning *`,
      [validUserId, category, title, content, postType]
    );
    const newPost = rows[0];

    if (postType === 'poll' && pollData && pollData.question) {
      const pointsPerVote = pollData.pointsPerVote || 5;
      const { rows: pollRows } = await pool.query(
        `insert into polls (post_id, question, points_per_vote, status)
         values ($1, $2, $3, 'active')
         returning *`,
        [newPost.id, pollData.question, pointsPerVote]
      );
      const newPoll = pollRows[0];

      const validOptions = (pollData.options || []).filter((opt) => opt && opt.trim().length > 0);
      for (const opt of validOptions) {
        await pool.query(`insert into poll_options (poll_id, option_text) values ($1, $2)`, [newPoll.id, opt.trim()]);
      }
    }

    return newPost;
  }

  /** สร้างโพสต์โดยตรง (admin only) */
  async createAdminPost(adminId: number, data: { category: string; title: string; content: string; pinned?: boolean }) {
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

  /** สร้างประกาศทางการจากแอดมิน (เผยแพร่ทันที) */
  async createAnnouncement(
    adminUserId: number,
    data: { title: string; body: string; category?: string; pinned?: boolean }
  ) {
    const { rows } = await pool.query(
      `INSERT INTO posts (admin_id, title, content, category, status, pinned, published_at, created_at)
       VALUES ($1, $2, $3, $4, 'published', $5, NOW(), NOW())
       RETURNING id, title, content, category, pinned, created_at`,
      [adminUserId, data.title, data.body, data.category || 'ประกาศทางการ', data.pinned ? true : false]
    );
    return rows[0];
  }

  /** Toggle pin post */
  async togglePin(postId: number) {
    const { rows } = await pool.query(`UPDATE posts SET pinned = NOT pinned WHERE id = $1 RETURNING id, pinned`, [postId]);
    return rows[0] ?? null;
  }

  /** ลบโพสต์พร้อมข้อมูลที่เกี่ยวข้อง (Admin only) */
  async deletePost(postId: number, adminId: number) {
    const { rows: adminUser } = await pool.query(`select id, role from users where id = $1`, [adminId]);
    if (!adminUser.length || adminUser[0].role !== 'admin') {
      throw new Error('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบโพสต์ได้');
    }

    await pool.query(`delete from post_interactions where post_id = $1`, [postId]);
    await pool.query(`delete from poll_votes where poll_id in (select id from polls where post_id = $1)`, [postId]);
    await pool.query(`delete from poll_options where poll_id in (select id from polls where post_id = $1)`, [postId]);
    await pool.query(`delete from polls where post_id = $1`, [postId]);
    await pool.query(`delete from media_assets where owner_type = 'post' and owner_id = $1`, [postId]);

    const { rows } = await pool.query(`delete from posts where id = $1 returning id, title`, [postId]);

    if (rows.length > 0) {
      try {
        await pool.query(
          `insert into audit_logs (actor_id, action, target_type, target_id) values ($1, 'delete_post', 'post', $2)`,
          [adminId, postId]
        );
      } catch {
        // audit_logs table optional
      }
    }

    return rows[0] ?? null;
  }

  /**
   * สำหรับ Admin: ดูคำขอโพสต์ที่ยังรออนุมัติ (สถานะ pending_request — ปัจจุบันไม่มี flow ใดสร้างโพสต์ด้วยสถานะนี้แล้ว
   * เนื่องจาก submitPostRequest() เผยแพร่ทันที คงไว้เพื่อความเข้ากันได้กับ approvePostRequest/rejectPostRequest ด้านล่าง)
   */
  async getPendingRequests() {
    const { rows: posts } = await pool.query(`
      select p.*, u.name as requester_name
      from posts p
      join users u on u.id = p.requested_by
      where p.status = 'pending_request'
      order by p.created_at asc
    `);

    const withPolls = [];
    for (const post of posts) {
      if (post.post_type === 'poll') {
        const { rows: pollRows } = await pool.query(
          `select id, question, points_per_vote from polls where post_id = $1`,
          [post.id]
        );
        if (pollRows.length > 0) {
          const { rows: options } = await pool.query(
            `select id, option_text as text from poll_options where poll_id = $1 order by id`,
            [pollRows[0].id]
          );
          withPolls.push({
            ...post,
            poll: {
              id: pollRows[0].id,
              question: pollRows[0].question,
              pointsPerVote: pollRows[0].points_per_vote,
              options,
            },
          });
          continue;
        }
      }
      withPolls.push(post);
    }
    return withPolls;
  }

  async approvePostRequest(postId: number, adminId: number) {
    const { rows } = await pool.query(
      `update posts
       set status = 'published', admin_id = $2, published_at = now()
       where id = $1 and status = 'pending_request'
       returning *`,
      [postId, adminId]
    );
    return rows[0] ?? null;
  }

  async rejectPostRequest(postId: number) {
    const { rows } = await pool.query(
      `update posts set status = 'rejected' where id = $1 and status = 'pending_request' returning *`,
      [postId]
    );
    return rows[0] ?? null;
  }

  /** ดึง leaderboard คะแนนรวมของ alumni */
  async getLeaderboard(limit = 20) {
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

  /** สมาชิกที่เข้าร่วมเดือนนี้ — สำหรับวิดเจ็ต sidebar */
  async getBirthdayAlumni(currentMonth: number, limit = 5) {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.avatar_url, gen.label as generation
       FROM users u
       LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
       WHERE u.status = 'approved'
         AND EXTRACT(MONTH FROM u.created_at) = $1
       ORDER BY u.created_at DESC
       LIMIT $2`,
      [currentMonth, limit]
    );
    return rows;
  }

  /** ศิษย์เก่าแบบสุ่ม — สำหรับวิดเจ็ต icebreaker บน sidebar */
  async getRandomAlumniPool(excludeUserId: number, limit = 5) {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.avatar_url, u.position, u.company, u.bio,
              gen.label as generation
       FROM users u
       LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
       WHERE u.status = 'approved' AND u.role = 'alumni'
         AND u.id != $1
       ORDER BY RANDOM()
       LIMIT $2`,
      [excludeUserId, limit]
    );
    return rows;
  }
}

export const feedDbService = new FeedDbService();
