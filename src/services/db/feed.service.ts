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
}

export interface FeedPollOption {
  id: number;
  text: string;
  voteCount: number;
}

export interface FeedPoll {
  id: number;
  question: string;
  pointsPerVote: number;
  options: FeedPollOption[];
  hasVoted?: boolean;
  userVotedOptionId?: number;
}

export interface FeedPostItem {
  id: number;
  category: string;
  title: string;
  body: string;
  author: string;
  authorId: number;
  authorName: string;
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
          COALESCE(admin.role, req.role, 'admin') as author_role,
          COALESCE(like_stat.like_count, 0)::int as like_count,
          COALESCE(comment_stat.comment_count, 0)::int as comment_count,
          ${currentUserId ? `EXISTS(SELECT 1 FROM post_interactions WHERE post_id = p.id AND user_id = ${Number(currentUserId)} AND type IN ('like', 'reaction')) as is_liked` : 'false as is_liked'}
        FROM posts p
        LEFT JOIN users admin ON admin.id = p.admin_id
        LEFT JOIN users req ON req.id = p.requested_by
        LEFT JOIN (
          SELECT post_id, COUNT(*) as like_count 
          FROM post_interactions 
          WHERE type IN ('like', 'reaction') 
          GROUP BY post_id
        ) like_stat ON like_stat.post_id = p.id
        LEFT JOIN (
          SELECT post_id, COUNT(*) as comment_count 
          FROM post_interactions 
          WHERE type = 'comment' 
          GROUP BY post_id
        ) comment_stat ON comment_stat.post_id = p.id
        WHERE p.status IN ('published', 'approved')
        ORDER BY p.pinned DESC, p.created_at DESC
        LIMIT 50
      `);

      const postIds = posts.map((p) => p.id);
      if (postIds.length === 0) return [];

      const { rows: comments } = await pool.query(
        `SELECT pi.id, pi.post_id, pi.user_id, pi.content, pi.created_at,
                u.name as user_name, u.avatar_url as user_avatar
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
      let userVotes: any[] = [];

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

        if (currentUserId) {
          const { rows: uv } = await pool.query(
            `SELECT pv.poll_id, pv.option_id
             FROM poll_votes pv
             WHERE pv.poll_id = ANY($1::int[]) AND pv.user_id = $2`,
            [pollIds, currentUserId]
          );
          userVotes = uv;
        }
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
          }));

        const poll = polls.find((pl) => pl.post_id === p.id);
        let formattedPoll: FeedPoll | undefined;

        if (poll) {
          const options = pollOptions
            .filter((opt) => opt.poll_id === poll.id)
            .map((opt) => ({
              id: opt.id,
              text: opt.option_text,
              voteCount: opt.vote_count,
            }));

          const userVote = userVotes.find((uv) => uv.poll_id === poll.id);

          formattedPoll = {
            id: poll.id,
            question: poll.question,
            pointsPerVote: poll.points_per_vote || 5,
            options,
            hasVoted: !!userVote,
            userVotedOptionId: userVote?.option_id,
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
   * เพิ่มคอมเมนต์ในโพสต์ (+1 แต้มกิจกรรม)
   */
  async addComment(postId: number, userId: number, content: string) {
    const { rows } = await pool.query(
      `INSERT INTO post_interactions (post_id, user_id, type, content, points_earned)
       VALUES ($1, $2, 'comment', $3, 1)
       RETURNING id, created_at`,
      [postId, userId, content]
    );

    // ให้คะแนนผู้ใช้ +1
    await pool.query(
      `UPDATE users SET total_points = total_points + 1 WHERE id = $1`,
      [userId]
    );

    try {
      await pool.query(
        `INSERT INTO point_transactions (user_id, points, reason, reference_id)
         VALUES ($1, 1, 'comment_post', $2)`,
        [userId, String(postId)]
      );
    } catch {}

    return rows[0];
  }

  /**
   * Toggle Like โพสต์
   */
  async toggleLike(postId: number, userId: number) {
    const { rows: existing } = await pool.query(
      `SELECT id FROM post_interactions WHERE post_id = $1 AND user_id = $2 AND type IN ('like', 'reaction')`,
      [postId, userId]
    );

    if (existing.length > 0) {
      await pool.query(`DELETE FROM post_interactions WHERE id = $1`, [existing[0].id]);
      return { liked: false };
    } else {
      await pool.query(
        `INSERT INTO post_interactions (post_id, user_id, type) VALUES ($1, $2, 'like')`,
        [postId, userId]
      );
      return { liked: true };
    }
  }

  /**
   * โหวต Poll (+5 แต้มกิจกรรม)
   */
  async votePoll(pollId: number, optionId: number, userId: number) {
    const { rows: existing } = await pool.query(
      `SELECT id FROM poll_votes WHERE poll_id = $1 AND user_id = $2`,
      [pollId, userId]
    );

    if (existing.length > 0) {
      throw new Error('คุณได้โหวตในโพลนี้ไปแล้ว');
    }

    await pool.query(
      `INSERT INTO poll_votes (poll_id, option_id, user_id, points_awarded) VALUES ($1, $2, $3, 5)`,
      [pollId, optionId, userId]
    );

    // ให้คะแนนผู้ใช้ +5
    await pool.query(
      `UPDATE users SET total_points = total_points + 5 WHERE id = $1`,
      [userId]
    );

    try {
      await pool.query(
        `INSERT INTO point_transactions (user_id, points, reason, reference_id)
         VALUES ($1, 5, 'vote_poll', $2)`,
        [userId, String(pollId)]
      );
    } catch {}

    return { success: true };
  }

  /**
   * สมาชิกส่งคำขอเสนอโพสต์เข้าคิวให้ Admin ตรวจสอบ
   */
  async submitPostRequest(userId: number, data: { title: string; body: string; category: string; imageUrl?: string }) {
    const { rows } = await pool.query(
      `INSERT INTO posts (requested_by, title, content, category, status)
       VALUES ($1, $2, $3, $4, 'pending_request')
       RETURNING id, title, status, created_at`,
      [userId, data.title, data.body, data.category || 'ทั่วไป']
    );
    return rows[0];
  }
}

export const feedDbService = new FeedDbService();
