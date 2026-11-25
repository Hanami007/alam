import { pool } from '@/lib/db';
import { checkLength } from '@/lib/field-limits';
import { DEFAULT_COMMENT_EMOJI } from '@/lib/reactions';
import { MAX_POST_IMAGES, deletePostImageFile, savePostImageFromDataUrl } from '@/lib/upload-storage';

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
  // การกดถูกใจความคิดเห็น (comment_reactions)
  likeCount: number;
  likedByMe: boolean;
  myEmoji?: string;
  topEmoji?: string;
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
  /** รูปในโพสต์ (post_images) เรียงตาม sort_order สูงสุด 4 รูป */
  images: string[];
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
  async getPosts(currentUserId?: number, category?: string): Promise<FeedPostItem[]> {
    try {
      // กรองหมวดหมู่ฝั่ง server — ฟีดดึงแค่ 50 โพสต์ล่าสุด ถ้ากรองฝั่งหน้าเว็บจะไม่เห็นโพสต์เก่าในหมวดนั้น
      const categoryFilter = category?.trim() || null;
      const { rows: posts } = await pool.query(`
        SELECT
          p.id, p.category, p.title, p.content as body, p.pinned, p.created_at, p.status,
          -- ผู้เขียน = คนขอโพสต์ (requested_by) ก่อน ถ้าไม่มีแปลว่าแอดมินโพสต์เอง (published_by)
          -- เดิมเอา published_by ขึ้นก่อน โพสต์ของสมาชิกที่แอดมินกดอนุมัติจึงขึ้นชื่อแอดมินเป็นคนเขียน
          COALESCE(req.id, admin.id, 1) as author_id,
          COALESCE(req.name, admin.name, 'ผู้ดูแลระบบ') as author_name,
          COALESCE(req.avatar_url, admin.avatar_url) as author_avatar,
          COALESCE(req.role, admin.role, 'admin') as author_role,
          COALESCE(req.is_available_for_mentorship, admin.is_available_for_mentorship, false) as is_available_for_mentorship,
          COALESCE(like_stat.like_count, 0)::int as like_count,
          COALESCE(comment_stat.comment_count, 0)::int as comment_count,
          ${currentUserId ? `EXISTS(SELECT 1 FROM post_interactions WHERE post_id = p.id AND user_id = ${Number(currentUserId)} AND type = 'reaction') as is_liked` : 'false as is_liked'}
        FROM posts p
        LEFT JOIN users admin ON admin.id = p.published_by
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
          WHERE type = 'comment' AND NOT is_hidden
          GROUP BY post_id
        ) comment_stat ON comment_stat.post_id = p.id
        WHERE p.status IN ('published', 'approved') AND NOT p.is_hidden
          AND ($1::text IS NULL OR p.category = $1)
        ORDER BY p.pinned DESC, COALESCE(p.published_at, p.created_at) DESC, p.created_at DESC
        LIMIT 50
      `, [categoryFilter]);

      const postIds = posts.map((p) => p.id);
      if (postIds.length === 0) return [];

      const { rows: comments } = await pool.query(
        `SELECT pi.id, pi.post_id, pi.user_id, pi.content, pi.created_at,
                u.name as user_name, u.avatar_url as user_avatar, u.is_available_for_mentorship
         FROM post_interactions pi
         JOIN users u ON u.id = pi.user_id
         WHERE pi.post_id = ANY($1::int[]) AND pi.type = 'comment' AND NOT pi.is_hidden
         ORDER BY pi.created_at ASC`,
        [postIds]
      );

      // ยอดถูกใจความคิดเห็น — แยก try ไว้ ถ้ายังไม่ได้รัน migration comment_reactions ฟีดต้องยังโหลดได้
      const reactionsByComment = new Map<number, { like_count: number; my_emoji: string | null; top_emoji: string | null }>();
      if (comments.length > 0) {
        try {
          const { rows: reactions } = await pool.query(
            `SELECT comment_id,
                    COUNT(*)::int AS like_count,
                    MAX(emoji) FILTER (WHERE user_id = $2) AS my_emoji,
                    MODE() WITHIN GROUP (ORDER BY emoji) AS top_emoji
             FROM comment_reactions
             WHERE comment_id = ANY($1::int[])
             GROUP BY comment_id`,
            [comments.map((c) => c.id), currentUserId ?? 0]
          );
          for (const r of reactions) reactionsByComment.set(r.comment_id, r);
        } catch (err) {
          console.error('[FeedDbService] comment reactions error:', err);
        }
      }

      // รูปในโพสต์ — แยก try ไว้ ถ้ายังไม่ได้รัน migration post_images ฟีดต้องยังโหลดได้
      const imagesByPost = new Map<number, string[]>();
      try {
        const { rows: images } = await pool.query(
          `SELECT post_id, image_url FROM post_images WHERE post_id = ANY($1::int[]) ORDER BY post_id, sort_order`,
          [postIds]
        );
        for (const img of images) {
          imagesByPost.set(img.post_id, [...(imagesByPost.get(img.post_id) ?? []), img.image_url]);
        }
      } catch (err) {
        console.error('[FeedDbService] post images error:', err);
      }

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
            likeCount: reactionsByComment.get(c.id)?.like_count ?? 0,
            likedByMe: Boolean(reactionsByComment.get(c.id)?.my_emoji),
            myEmoji: reactionsByComment.get(c.id)?.my_emoji ?? undefined,
            topEmoji: reactionsByComment.get(c.id)?.top_emoji ?? undefined,
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
          images: imagesByPost.get(p.id) ?? [],
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
              COALESCE(r.name, a.name) AS author
       FROM posts p
       LEFT JOIN users a ON a.id = p.published_by
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
   * ถูกใจความคิดเห็น (คนละ 1 อีโมจิต่อความคิดเห็น)
   * - emoji ไม่ส่งมา: สลับ ถูกใจ (❤️) / ยกเลิก
   * - emoji ส่งมา: ตั้งหรือเปลี่ยนเป็นอีโมจินั้น (ไม่ยกเลิก)
   * คืน null ถ้าไม่พบความคิดเห็น (หรือถูกซ่อนไปแล้ว)
   */
  async reactToComment(commentId: number, userId: number, emoji?: string) {
    const { rows: found } = await pool.query(
      `SELECT 1 FROM post_interactions WHERE id = $1 AND type = 'comment' AND NOT is_hidden`,
      [commentId]
    );
    if (found.length === 0) return null;

    const { rows: existing } = await pool.query(
      `SELECT emoji FROM comment_reactions WHERE comment_id = $1 AND user_id = $2`,
      [commentId, userId]
    );

    let liked: boolean;
    if (existing.length > 0 && emoji === undefined) {
      await pool.query(`DELETE FROM comment_reactions WHERE comment_id = $1 AND user_id = $2`, [commentId, userId]);
      liked = false;
    } else {
      // INSERT ... ON CONFLICT กันกดรัวสองแท็บพร้อมกันแล้วชน UNIQUE (comment_id, user_id)
      await pool.query(
        `INSERT INTO comment_reactions (comment_id, user_id, emoji) VALUES ($1, $2, $3)
         ON CONFLICT (comment_id, user_id) DO UPDATE SET emoji = EXCLUDED.emoji`,
        [commentId, userId, emoji ?? DEFAULT_COMMENT_EMOJI]
      );
      liked = true;
    }

    const { rows: stat } = await pool.query(
      `SELECT COUNT(*)::int AS count,
              MAX(emoji) FILTER (WHERE user_id = $2) AS my_emoji,
              MODE() WITHIN GROUP (ORDER BY emoji) AS top_emoji
       FROM comment_reactions WHERE comment_id = $1`,
      [commentId, userId]
    );
    return {
      liked,
      count: stat[0]?.count ?? 0,
      emoji: stat[0]?.my_emoji ?? stat[0]?.top_emoji ?? DEFAULT_COMMENT_EMOJI,
    };
  }

  /** หมวดหมู่ที่มีโพสต์เผยแพร่อยู่ พร้อมจำนวนโพสต์ (ใช้ทำตัวกรองหน้าฟีด) */
  async getCategories(): Promise<{ category: string; count: number }[]> {
    const { rows } = await pool.query(
      `SELECT p.category, COUNT(*)::int AS count
       FROM posts p
       WHERE p.status IN ('published', 'approved') AND NOT p.is_hidden
         AND p.category IS NOT NULL AND btrim(p.category) <> ''
       GROUP BY p.category
       ORDER BY count DESC, p.category ASC`
    );
    return rows.map((r) => ({ category: r.category, count: r.count }));
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
      // เดิมตอนยกเลิกไลก์ ลบแค่แถว post_interactions แต่ไม่หักแต้มที่เคยให้ไปตอนกดไลก์คืนเลย —
      // แปลว่ากดไลก์/เลิกไลก์โพสต์เดิมซ้ำไปเรื่อยๆ จะได้ +1 แต้มสะสมทุกรอบแบบไม่มีที่สิ้นสุด (ยืนยัน
      // แล้วด้วยการทดสอบจริง) ต้องหักแต้มคืนให้เท่ากับตอนให้ไปเป๊ะ ป้องกันการฟาร์มแต้ม
      await pool.query(`delete from post_interactions where id = $1`, [existing[0].id]);
      await pool.query(`update users set total_points = greatest(total_points - 1, 0) where id = $1`, [userId]);
      try {
        await pool.query(
          `insert into point_transactions (user_id, points, reason, reference_id)
           values ($1, -1, 'unlike_post', $2)`,
          [userId, String(postId)]
        );
      } catch {}
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

    // บันทึกโหวต + ให้แต้มอยู่ใน transaction เดียวกัน — เดิมเป็น pool.query แยก 2 คำสั่ง
    // ไม่มี BEGIN/COMMIT ครอบ ถ้า UPDATE total_points พังกลางทาง (เช่น connection หลุด)
    // จะเหลือแค่แถวโหวตถูกบันทึกแต่แต้มไม่เข้า ข้อมูลไม่ตรงกันถาวร
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO poll_votes (poll_id, option_id, user_id, points_awarded)
         VALUES ($1, $2, $3, $4)`,
        [pollId, optionId, userId, points]
      );
      if (points > 0) {
        await client.query(`UPDATE users SET total_points = total_points + $1 WHERE id = $2`, [points, userId]);
      }
      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    if (points > 0) {
      try {
        await pool.query(
          `INSERT INTO point_transactions (user_id, points, reason, reference_id)
           VALUES ($1, $2, 'poll_vote', $3)`,
          [userId, points, String(pollId)]
        );
      } catch (logErr) {
        console.error('[votePoll] point_transactions insert failed:', logErr);
      }
    }
    return { success: true, pointsAwarded: points };
  }

  /**
   * สมาชิกส่งคำขอโพสต์ (รองรับโพลแบบสำรวจ) — เผยแพร่ทันที
   */
  /**
   * จำกัดจำนวนโพสต์ที่ user คนหนึ่งสร้างได้ภายในช่วงเวลาสั้นๆ
   * ป้องกันการกดส่งซ้ำๆ เร็วๆ (double-click / spam-click) สร้างโพสต์ซ้ำจำนวนมากในครั้งเดียว
   */
  async assertNotRateLimited(userId: number): Promise<void> {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS recent_count
       FROM posts
       WHERE requested_by = $1 AND created_at > NOW() - INTERVAL '15 seconds'`,
      [userId]
    );
    if ((rows[0]?.recent_count ?? 0) > 0) {
      throw new Error('กรุณารอสักครู่ก่อนสร้างโพสต์ใหม่ (ป้องกันการส่งซ้ำ)');
    }

    const { rows: hourlyRows } = await pool.query(
      `SELECT COUNT(*)::int AS hourly_count
       FROM posts
       WHERE requested_by = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
      [userId]
    );
    if ((hourlyRows[0]?.hourly_count ?? 0) >= 10) {
      throw new Error('คุณสร้างโพสต์ครบจำนวนสูงสุดต่อชั่วโมงแล้ว กรุณาลองใหม่ภายหลัง');
    }
  }

  async submitPostRequest(
    requestedBy: number,
    title: string,
    content: string,
    category: string,
    postType: 'normal' | 'poll' = 'normal',
    pollData?: { question: string; options: string[]; pointsPerVote?: number },
    imageDataUrls: string[] = []
  ) {
    if (imageDataUrls.length > MAX_POST_IMAGES) {
      throw new Error(`แนบรูปได้ไม่เกิน ${MAX_POST_IMAGES} รูปต่อโพสต์`);
    }
    await this.assertNotRateLimited(requestedBy);

    // จำกัดความยาวฝั่ง server ให้ตรงกับ maxLength ของฟอร์มจริง (feed-list.tsx: title/question
    // 100 ตัวอักษร, เนื้อหา 1000, ตัวเลือกโพล 60) — เดิมมีแค่ maxLength ฝั่ง client เท่านั้น
    // ยิง API ตรงๆ ข้าม UI ใส่ข้อความยาวเท่าไหร่ก็ได้ ไม่มีอะไรกันเลย
    if (!title || title.trim().length === 0) {
      throw new Error('กรุณาระบุหัวข้อโพสต์');
    }
    const lengthError =
      checkLength(title, 'postTitle', 'หัวข้อโพสต์') ||
      checkLength(content, 'postContent', 'เนื้อหาโพสต์') ||
      checkLength(category, 'postCategory', 'หมวดหมู่') ||
      (postType === 'poll' && pollData
        ? checkLength(pollData.question, 'pollQuestion', 'คำถามโพล') ||
          (pollData.options || []).map((opt) => checkLength(opt, 'pollOption', 'ตัวเลือกโพลแต่ละข้อ')).find(Boolean) ||
          null
        : null);
    if (lengthError) throw new Error(lengthError);

    // ผู้ใช้ที่ authenticated แล้ว (getCurrentUser ตรวจแล้วก่อนเรียกฟังก์ชันนี้) ต้องมีอยู่จริง
    // ใน DB เสมอ — เดิมถ้าไม่เจอ (เช่น user ถูกลบไปกลางที่ session ยังไม่หมดอายุ) จะเงียบๆ
    // สวมรอยเป็นโพสต์ของ user คนแรกในตารางแทน (ระบุตัวคนโพสต์ผิดคน) ควรปฏิเสธคำขอแทน
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [requestedBy]);
    if (userCheck.rows.length === 0) {
      throw new Error('ไม่พบบัญชีผู้ใช้ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
    }

    // เขียนไฟล์รูปก่อน (sharp ตรวจว่าเป็นรูปจริง) — ถ้ารูปไหนเสีย จะไม่มีโพสต์ครึ่งๆ กลางๆ ค้างใน DB
    const imageUrls: string[] = [];
    try {
      for (const dataUrl of imageDataUrls) imageUrls.push(await savePostImageFromDataUrl(dataUrl));
    } catch (err) {
      await Promise.all(imageUrls.map((url) => deletePostImageFile(url)));
      throw err;
    }

    // โพสต์ + โพล + รูป อยู่ใน transaction เดียว พังขั้นไหนย้อนกลับทั้งหมด
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `insert into posts (requested_by, category, title, content, post_type, status, published_at)
         values ($1, $2, $3, $4, $5, 'published', now())
         returning *`,
        [requestedBy, category, title, content, postType]
      );
      const newPost = rows[0];

      if (postType === 'poll' && pollData && pollData.question) {
        const pointsPerVote = pollData.pointsPerVote || 5;
        const { rows: pollRows } = await client.query(
          `insert into polls (post_id, question, points_per_vote, status)
           values ($1, $2, $3, 'active')
           returning *`,
          [newPost.id, pollData.question, pointsPerVote]
        );
        const newPoll = pollRows[0];

        const validOptions = (pollData.options || []).filter((opt) => opt && opt.trim().length > 0);
        for (const opt of validOptions) {
          await client.query(`insert into poll_options (poll_id, option_text) values ($1, $2)`, [newPoll.id, opt.trim()]);
        }
      }

      for (const [i, url] of imageUrls.entries()) {
        await client.query(`insert into post_images (post_id, image_url, sort_order) values ($1, $2, $3)`, [
          newPost.id,
          url,
          i + 1,
        ]);
      }

      await client.query('COMMIT');
      return { ...newPost, images: imageUrls };
    } catch (err) {
      await client.query('ROLLBACK');
      await Promise.all(imageUrls.map((url) => deletePostImageFile(url)));
      throw err;
    } finally {
      client.release();
    }
  }

  /** สร้างโพสต์โดยตรง (admin only) */
  async createAdminPost(adminId: number, data: { category: string; title: string; content: string; pinned?: boolean }) {
    const { rows } = await pool.query(
      `INSERT INTO posts (published_by, category, title, content, post_type, status, pinned, published_at)
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
      `INSERT INTO posts (published_by, title, content, category, status, pinned, published_at, created_at)
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
  /**
   * ปักหมุด / เลิกปักหมุดโพสต์ (แอดมิน) — โพสต์ที่ปักหมุดขึ้นบนสุดของฟีด (ORDER BY p.pinned DESC ใน getPosts)
   * คืน null ถ้าไม่พบโพสต์ที่แสดงอยู่ในฟีด
   */
  async setPinned(postId: number, pinned: boolean, adminId: number) {
    const { rows } = await pool.query(
      `UPDATE posts SET pinned = $2
       WHERE id = $1 AND status IN ('published', 'approved')
       RETURNING id`,
      [postId, pinned]
    );
    if (rows.length === 0) return null;

    try {
      await pool.query(
        `INSERT INTO audit_logs (actor_id, action, target_type, target_id) VALUES ($1, $2, 'post', $3)`,
        [adminId, pinned ? 'pin_post' : 'unpin_post', postId]
      );
    } catch {
      // audit_logs table optional (เหมือน deletePost)
    }
    return rows[0];
  }

  async deletePost(postId: number, adminId: number) {
    const { rows: adminUser } = await pool.query(`select id, role from users where id = $1`, [adminId]);
    if (!adminUser.length || adminUser[0].role !== 'admin') {
      throw new Error('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบโพสต์ได้');
    }

    await pool.query(`delete from post_interactions where post_id = $1`, [postId]);
    await pool.query(`delete from poll_votes where poll_id in (select id from polls where post_id = $1)`, [postId]);
    await pool.query(`delete from poll_options where poll_id in (select id from polls where post_id = $1)`, [postId]);
    await pool.query(`delete from polls where post_id = $1`, [postId]);
    // แถว post_images ลบตาม cascade — เก็บ path ไว้ลบไฟล์บนดิสก์หลังลบโพสต์สำเร็จ
    const { rows: imageRows } = await pool.query(`select image_url from post_images where post_id = $1`, [postId]);

    const { rows } = await pool.query(`delete from posts where id = $1 returning id, title`, [postId]);
    if (rows.length > 0) await Promise.all(imageRows.map((r) => deletePostImageFile(r.image_url)));

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
       set status = 'published', published_by = $2, published_at = now()
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

  /**
   * ส่งคำอวยพรวันเกิดให้ศิษย์เก่าอีกคน — ให้ +1 แต้มแก่ผู้ส่งจริงๆ (idempotent ต่อวัน)
   *
   * เดิม UI (feed-list.tsx handleSendWish) โชว์ "+1 แต้ม" ให้ผู้ใช้เห็น แต่ยิง PUT
   * /api/user/profile ด้วยฟิลด์ pointsAdded ซึ่งฝั่ง server ไม่เคยอ่านฟิลด์นี้เลย (เงียบๆ ทิ้งไป)
   * แต้มที่เห็นเป็นแค่ state ฝั่ง browser พอรีเฟรช/ล็อกอินใหม่ก็หายไป — ทำให้เป็นสัญญาปลอม
   * ย้ายมาเป็น endpoint เฉพาะที่ให้แต้มจริงใน DB และกันสแปม (ส่งซ้ำคนเดิมวันเดียวกันไม่ได้แต้มซ้ำ)
   * โดยใช้ point_transactions เป็นตัวเช็คความซ้ำ (reason='birthday_wish', reference_id=`recipientId:วันที่`)
   */
  async sendBirthdayWish(senderId: number, recipientId: number): Promise<{ alreadySent: boolean }> {
    if (senderId === recipientId) {
      throw new Error('ไม่สามารถอวยพรวันเกิดให้ตัวเองได้');
    }
    const today = new Date().toISOString().slice(0, 10);
    const referenceId = `${recipientId}:${today}`;

    const { rows: existing } = await pool.query(
      `SELECT id FROM point_transactions WHERE user_id = $1 AND reason = 'birthday_wish' AND reference_id = $2`,
      [senderId, referenceId]
    );
    if (existing.length > 0) {
      return { alreadySent: true };
    }

    await pool.query(`UPDATE users SET total_points = total_points + 1 WHERE id = $1`, [senderId]);
    await pool.query(
      `INSERT INTO point_transactions (user_id, points, reason, reference_id) VALUES ($1, 1, 'birthday_wish', $2)`,
      [senderId, referenceId]
    );
    return { alreadySent: false };
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
