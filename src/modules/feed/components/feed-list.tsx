'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  Pin,
  Sparkles,
  Image as ImageIcon,
  Globe,
  MoreHorizontal,
  CheckCircle2,
  Tag,
  Megaphone,
  HelpCircle,
  FileText,
  Smile,
  Zap,
  Trophy,
  Crown,
  Gift,
  PartyPopper,
  Medal,
  Award,
  Dices,
  Sparkle,
  Flame,
  Volume2,
  Trash2,
  AlertTriangle,
  Shield,
  ShieldAlert,
  Check,
  X,
  UserCheck,
  Edit3
} from 'lucide-react';

interface Comment {
  id: number;
  content: string;
  created_at: string;
  author: string;
  avatar_url?: string;
  isAvailableForMentorship?: boolean;
  parentCommentId?: number | null;
}

interface PollOption {
  id: number;
  text: string;
  votes: number;
}

interface PollData {
  id: number;
  question: string;
  pointsPerVote?: number;
  options: PollOption[];
  votedUserIds?: number[];
  userVotes?: { user_id: number; option_id: number }[];
}

interface Post {
  id: number;
  title: string;
  body: string;
  author: string;
  pinned?: boolean;
  category?: string;
  created_at: string;
  likes: number;
  comments: number;
  commentsList?: Comment[];
  likedUserIds?: number[];
  selectedEmoji?: string;
  isAvailableForMentorship?: boolean;
  poll?: PollData;
}


interface FeedListProps {
  posts: Post[];
  stats: any;
  latestPhotos?: any[];
  featuredAlumni?: any[];
  currentUserId: number;
  currentUserRole?: string;
  currentUserName?: string;
  currentUserMentorship?: boolean;
}


// Sample Birthday Data for this month
const BIRTHDAY_ALUMNI = [
  { id: 101, name: 'พี่ณัฐพล ชัยชนะ', gen: 'รุ่น 38', date: '15 ส.ค.', avatar: 'ณพ' },
  { id: 102, name: 'น้องศิรินทร์ วงศ์คำ', gen: 'รุ่น 44', date: '22 ส.ค.', avatar: 'ศร' },
  { id: 103, name: 'พี่กิตติศักดิ์ สุขใจ', gen: 'รุ่น 40', date: '28 ส.ค.', avatar: 'กต' },
];

// Sample Leaderboard Top 3 Active Members
const TOP_LEADERBOARD = [
  { rank: 1, name: 'ดร.สมเกียรติ มั่นคง', gen: 'รุ่น 35', points: 1420, avatar: 'สม', badge: '🥇' },
  { rank: 2, name: 'คุณนลินี สุวรรณ', gen: 'รุ่น 41', points: 980, avatar: 'นล', badge: '🥈' },
  { rank: 3, name: 'คุณธีรยุทธ ก้องเกียรติ', gen: 'รุ่น 42', points: 750, avatar: 'ธี', badge: '🥉' },
];

// Fun Alumni Fortunes & Quotes
const ALUMNI_FORTUNES = [
  "🔮 สัปดาห์นี้จะมีรุ่นพี่สาย IT ทักมาแจกโอกาสดีๆ!",
  "✨ วันนี้วันมงคล เขียนโค้ดรันครั้งเดียวผ่านไร้ Bug 100%!",
  "🎉 คุณมีเกณฑ์ได้พอยท์กิจกรรมพิเศษ +50 คะแนนในเร็วๆ นี้",
  "💼 ทักษะความขยันของคุณกำลังไปเตะตารุ่นพี่แอดมินอยู่นะ!",
  "🌸 การได้กลับมาคุยกับเพื่อนเก่า จะนำพาโชคดีและแรงบันดาลใจมาให้",
];


const EMOJI_REACTIONS = [
  { emoji: '💖', label: 'ส่งหัวใจ' },
  { emoji: '🥳', label: 'ยินดีด้วย' },
  { emoji: '💡', label: 'ไอเดียดี' },
  { emoji: '👏', label: 'สุดยอด' },
  { emoji: '🥺', label: 'ซาบซึ้ง' },
];

interface BurstParticle {
  id: number;
  originX: number;
  originY: number;
  burstX: number;
  burstY: number;
  emoji: string;
  sizeRem: number;
  rotDeg: number;
  durationSec: number;
  delaySec: number;
}

export function FeedList({
  posts = [],
  stats,
  latestPhotos = [],
  featuredAlumni = [],
  currentUserId,
  currentUserRole = 'alumni',
  currentUserName = 'สมชาย ใจดี',
  currentUserMentorship = false,
}: FeedListProps) {
  // Current Role (from authenticated session)
  const activeRole: 'admin' | 'alumni' = (currentUserRole as 'admin' | 'alumni') || 'alumni';

  // Feed State
  const [feedPosts, setFeedPosts] = useState<Post[]>(posts);
  const [openComments, setOpenComments] = useState<Record<number, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Reaction Picker Popover State
  const [activeReactionPicker, setActiveReactionPicker] = useState<number | null>(null);

  // Birthday Wishes State
  const [wishedIds, setWishedIds] = useState<Record<number, boolean>>({});

  // Fun Widgets State
  const [fortuneIndex, setFortuneIndex] = useState<number>(0);
  const [isSpinningFortune, setIsSpinningFortune] = useState<boolean>(false);


  // Radial Burst Particle State
  const [floatingHearts, setFloatingHearts] = useState<BurstParticle[]>([]);

  // ─── Comment Like & Reply State ───────────────────────────────────
  const [commentLikes, setCommentLikes] = useState<Record<number, { count: number; likedByMe: boolean; emoji: string }>>({});
  const [activeCommentReactionPicker, setActiveCommentReactionPicker] = useState<number | null>(null);
  const [replyTargets, setReplyTargets] = useState<Record<number, { commentId: number; authorName: string } | null>>({});

  // ─── Post Request Form State (Supports Normal & Poll) ─────────────
  const [showRequestForm, setShowRequestForm] = useState<boolean>(false);
  const [requestForm, setRequestForm] = useState<{
    postType: 'normal' | 'poll';
    title: string;
    content: string;
    category: string;
    pollQuestion: string;
    pollOptions: string[];
    pointsPerVote: number;
  }>({
    postType: 'normal',
    title: '',
    content: '',
    category: 'ทั่วไป',
    pollQuestion: '',
    pollOptions: ['', ''],
    pointsPerVote: 5,
  });
  const [requestStatus, setRequestStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // Dynamic Poll Options helpers
  function handleAddPollOption() {
    if (requestForm.pollOptions.length < 6) {
      setRequestForm((prev) => ({
        ...prev,
        pollOptions: [...prev.pollOptions, ''],
      }));
    }
  }

  function handleRemovePollOption(index: number) {
    if (requestForm.pollOptions.length > 2) {
      setRequestForm((prev) => ({
        ...prev,
        pollOptions: prev.pollOptions.filter((_, i) => i !== index),
      }));
    }
  }

  function handlePollOptionChange(index: number, value: string) {
    setRequestForm((prev) => {
      const updated = [...prev.pollOptions];
      updated[index] = value;
      return { ...prev, pollOptions: updated };
    });
  }


  // ─── Post Delete & Options Menu State (Admin Only) ────────────────
  const [activePostMenuId, setActivePostMenuId] = useState<number | null>(null);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState<boolean>(false);
  const [deleteToast, setDeleteToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside() {
      setActivePostMenuId(null);
    }
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Handle Post Deletion (Admin Only)
  async function confirmDeletePost() {
    if (!postToDelete) return;
    setIsDeletingPost(true);
    try {
      // In demo test mode: if activeRole is admin, use admin user ID 1, otherwise use currentUserId
      const adminIdToSend = activeRole === 'admin' ? 1 : currentUserId;
      const res = await fetch('/api/feed/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: postToDelete.id,
          adminId: adminIdToSend,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
        setPostToDelete(null);
        setDeleteToast({ message: 'ลบโพสต์ข่าวเรียบร้อยแล้ว ✨', type: 'success' });
        setTimeout(() => setDeleteToast(null), 3500);
      } else {
        setDeleteToast({ message: data.error || 'เกิดข้อผิดพลาดในการลบโพสต์', type: 'error' });
        setTimeout(() => setDeleteToast(null), 4000);
      }
    } catch (err: any) {
      setDeleteToast({ message: err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', type: 'error' });
      setTimeout(() => setDeleteToast(null), 4000);
    } finally {
      setIsDeletingPost(false);
    }
  }

  // Handle Voting in Poll
  async function handleVotePoll(postId: number, pollId: number, optionId: number, e?: React.MouseEvent) {
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      triggerFloatingHeart(rect.left + rect.width / 2, rect.top + rect.height / 2);
    } else {
      triggerFloatingHeart();
    }

    const targetPost = feedPosts.find((p) => p.id === postId);
    if (!targetPost || !targetPost.poll) return;

    const currentPoll = targetPost.poll;
    const isAlreadyVoted =
      currentPoll.votedUserIds?.includes(currentUserId) ||
      currentPoll.userVotes?.some((v) => v.user_id === currentUserId);

    if (isAlreadyVoted) {
      setDeleteToast({ message: '💡 คุณได้ร่วมลงคะแนนโหวตในโพลนี้เรียบร้อยแล้ว', type: 'error' });
      setTimeout(() => setDeleteToast(null), 3000);
      return;
    }

    // Optimistic UI update
    setFeedPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId || !post.poll) return post;
        const updatedOptions = post.poll.options.map((opt) =>
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        );
        return {
          ...post,
          poll: {
            ...post.poll,
            options: updatedOptions,
            votedUserIds: [...(post.poll.votedUserIds || []), currentUserId],
            userVotes: [...(post.poll.userVotes || []), { user_id: currentUserId, option_id: optionId }],
          },
        };
      })
    );

    try {
      const res = await fetch('/api/feed/poll/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId, optionId, userId: currentUserId }),
      });
      const data = await res.json();
      if (data.success) {
        setDeleteToast({
          message: `🎉 โหวตสำเร็จ! ได้รับ +${data.pointsAwarded || currentPoll.pointsPerVote || 5} คะแนนสะสม ✨`,
          type: 'success',
        });
        setTimeout(() => setDeleteToast(null), 3500);
      } else {
        setDeleteToast({ message: data.error || 'ไม่สามารถบันทึกการโหวตได้', type: 'error' });
        setTimeout(() => setDeleteToast(null), 3500);
      }
    } catch (err: any) {
      setDeleteToast({ message: err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', type: 'error' });
      setTimeout(() => setDeleteToast(null), 3500);
    }
  }



  async function handleSubmitPostRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!requestForm.title.trim()) return;

    const isPoll = requestForm.postType === 'poll';
    if (!isPoll && !requestForm.content.trim()) return;

    if (isPoll) {
      const validOptions = requestForm.pollOptions.filter((o) => o.trim().length > 0);
      if (validOptions.length < 2) {
        setDeleteToast({ message: '⚠️ โพลต้องมีตัวเลือกคำตอบอย่างน้อย 2 ข้อ', type: 'error' });
        setTimeout(() => setDeleteToast(null), 3000);
        return;
      }
    }

    setRequestStatus('submitting');
    try {
      const res = await fetch('/api/feed/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedBy: currentUserId,
          title: requestForm.title.trim(),
          content: isPoll
            ? (requestForm.content.trim() || requestForm.pollQuestion.trim() || requestForm.title.trim())
            : requestForm.content.trim(),
          category: requestForm.category.trim() || (isPoll ? 'โพลสำรวจความเห็น' : 'ทั่วไป'),
          postType: requestForm.postType,
          poll: isPoll
            ? {
                question: (requestForm.pollQuestion.trim() || requestForm.title.trim()),
                options: requestForm.pollOptions.filter((o) => o.trim().length > 0),
                pointsPerVote: requestForm.pointsPerVote || 5,
              }
            : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRequestStatus('success');
        setRequestForm({
          postType: 'normal',
          title: '',
          content: '',
          category: 'ทั่วไป',
          pollQuestion: '',
          pollOptions: ['', ''],
          pointsPerVote: 5,
        });
        setDeleteToast({
          message: isPoll ? '✨ ส่งคำขอสร้างโพลแบบสำรวจเรียบร้อยแล้ว!' : '✨ ส่งคำขอสร้างโพสต์เรียบร้อยแล้ว!',
          type: 'success',
        });
        setTimeout(() => setDeleteToast(null), 3500);
        setTimeout(() => {
          setRequestStatus('idle');
          setShowRequestForm(false);
        }, 2000);
      } else {
        setRequestStatus('error');
        setDeleteToast({ message: data.error || 'เกิดข้อผิดพลาดในการส่งคำขอ', type: 'error' });
        setTimeout(() => {
          setRequestStatus('idle');
          setDeleteToast(null);
        }, 3500);
      }
    } catch {
      setRequestStatus('error');
      setTimeout(() => setRequestStatus('idle'), 3000);
    }
  }

  // Spin Fortune Wheel
  function handleSpinFortune() {
    setIsSpinningFortune(true);
    setTimeout(() => {
      setFortuneIndex((prev) => (prev + 1) % ALUMNI_FORTUNES.length);
      setIsSpinningFortune(false);
    }, 400);
  }



  // Handle Birthday Wish Click
  function handleSendWish(id: number, e?: React.MouseEvent) {
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      triggerFloatingHeart(rect.left + rect.width / 2, rect.top + rect.height / 2);
    } else {
      triggerFloatingHeart();
    }
    setWishedIds((prev) => ({ ...prev, [id]: true }));
  }

  // Handle Emoji Selection for Post
  async function handleSelectEmojiReaction(postId: number, emojiObj: { emoji: string; label: string }, e?: React.MouseEvent) {
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      triggerFloatingHeart(rect.left + rect.width / 2, rect.top + rect.height / 2);
    } else {
      triggerFloatingHeart();
    }
    setActiveReactionPicker(null);

    setFeedPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const isAlreadyLiked = post.likedUserIds?.includes(currentUserId);
        const newLikes = isAlreadyLiked ? post.likes : post.likes + 1;
        const newLikedUserIds = isAlreadyLiked
          ? (post.likedUserIds || [])
          : [...(post.likedUserIds || []), currentUserId];

        return {
          ...post,
          likes: newLikes,
          likedUserIds: newLikedUserIds,
          selectedEmoji: emojiObj.emoji
        };
      })
    );

    try {
      await fetch('/api/feed/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: currentUserId }),
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Handle Default Like Toggle
  async function handleToggleLike(postId: number, e?: React.MouseEvent) {
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      triggerFloatingHeart(rect.left + rect.width / 2, rect.top + rect.height / 2);
    } else {
      triggerFloatingHeart();
    }

    setFeedPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const isLiked = post.likedUserIds?.includes(currentUserId);
        const newLikes = isLiked ? Math.max(0, post.likes - 1) : post.likes + 1;
        const newLikedUserIds = isLiked
          ? (post.likedUserIds || []).filter((id) => id !== currentUserId)
          : [...(post.likedUserIds || []), currentUserId];

        return {
          ...post,
          likes: newLikes,
          likedUserIds: newLikedUserIds,
          selectedEmoji: isLiked ? undefined : '💖'
        };
      })
    );

    try {
      await fetch('/api/feed/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: currentUserId }),
      });
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  }

  // 360-degree Smooth Explosion & Fall Particle Burst
  function triggerFloatingHeart(x?: number, y?: number) {
    const originX = x && x > 0 ? x : window.innerWidth / 2;
    const originY = y && y > 0 ? y : window.innerHeight / 2;
    const emojis = ['💖', '✨', '💕', '🌸', '🥳', '💗', '🎉', '🌟', '🎀', '🎂', '💌', '🎊'];
    const count = 16;

    const newParticles: BurstParticle[] = Array.from({ length: count }).map((_, i) => {
      const angleRad = (Math.random() * 360) * (Math.PI / 180);
      const distance = Math.random() * 110 + 50;

      return {
        id: Date.now() + i + Math.random(),
        originX,
        originY,
        burstX: Math.cos(angleRad) * distance,
        burstY: Math.sin(angleRad) * distance,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        sizeRem: Math.random() * 0.8 + 1.3,
        rotDeg: (Math.random() - 0.5) * 60,
        durationSec: Math.random() * 0.4 + 1.3,
        delaySec: 0,
      };
    });

    setFloatingHearts((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((p) => !newParticles.some((np) => np.id === p.id)));
    }, 2000);
  }

  // Toggle Comment Box
  function toggleCommentBox(postId: number) {
    setOpenComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  }

  // Handle Add Comment
  async function handleAddComment(postId: number) {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    setSubmittingComment((prev) => ({ ...prev, [postId]: true }));

    const parentCommentId = replyTargets[postId]?.commentId ?? null;

    const tempComment: Comment = {
      id: Date.now(),
      content: text,
      created_at: new Date().toISOString(),
      author: currentUserName || 'ศิษย์เก่า',
      isAvailableForMentorship: currentUserMentorship,
      parentCommentId,
    };

    setFeedPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          comments: post.comments + 1,
          commentsList: [...(post.commentsList || []), tempComment],
        };
      })
    );
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));

    try {
      const res = await fetch('/api/feed/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: currentUserId, content: text, parentCommentId }),
      });
      const data = await res.json();
      if (data.success && data.comment) {
        setFeedPosts((prev) =>
          prev.map((post) => {
            if (post.id !== postId) return post;
            const updatedList = (post.commentsList || []).map((c) =>
              c.id === tempComment.id ? { ...data.comment, parentCommentId } : c
            );
            return { ...post, commentsList: updatedList };
          })
        );
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  }

  // Share button link copy
  function handleShare(postId: number) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/feed#post-${postId}`);
      setCopiedId(postId);
      setTimeout(() => setCopiedId(null), 2500);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_380px] max-w-7xl mx-auto font-sans items-start px-2 sm:px-4 relative">

      {/* 360 Explosion & Gravity Fall Particle Overlay */}
      {floatingHearts.map((particle) => (
        <div
          key={particle.id}
          style={{
            left: `${particle.originX}px`,
            top: `${particle.originY}px`,
            fontSize: `${particle.sizeRem}rem`,
            '--burst-x': `${particle.burstX}px`,
            '--burst-y': `${particle.burstY}px`,
            '--rot': `${particle.rotDeg}deg`,
            '--dur': `${particle.durationSec}s`,
            '--delay': `${particle.delaySec}s`,
          } as React.CSSProperties}
          className="fixed z-50 pointer-events-none animate-pop-fall drop-shadow-xl select-none -translate-x-1/2 -translate-y-1/2"
        >
          {particle.emoji}
        </div>
      ))}

      {/* ===== LEFT COLUMN: ENLARGED & SPACIOUS CUTE FEED ===== */}
      <div className="space-y-7 min-w-0">

        {/* ===== POST REQUEST FORM CARD ===== */}
        <div className="rounded-[32px] border border-indigo-200/80 bg-white shadow-card overflow-hidden">
          <button
            onClick={() => setShowRequestForm((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-indigo-50/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-400 to-purple-500 shadow-sm">
                <Send className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">ร้องขอสร้างโพสต์</p>
                <p className="text-xs text-slate-400">แอดมินจะรีวิวและอนุมัติให้ภายหลัง</p>
              </div>
            </div>
            <span className={`text-slate-400 transition-transform duration-200 ${showRequestForm ? 'rotate-180' : ''}`}>▾</span>
          </button>

          {showRequestForm && (
            <form
              onSubmit={handleSubmitPostRequest}
              className="border-t border-indigo-100/60 px-6 py-5 space-y-4 bg-indigo-50/20"
            >
              {/* Type Switcher: Normal Post vs Poll Survey */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">รูปแบบโพสต์</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setRequestForm((f) => ({ ...f, postType: 'normal', category: 'ทั่วไป' }))}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all ${
                      requestForm.postType === 'normal'
                        ? 'bg-indigo-500 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    <span>📝 โพสต์ข่าวทั่วไป</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestForm((f) => ({ ...f, postType: 'poll', category: 'โพลสำรวจความเห็น' }))}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all ${
                      requestForm.postType === 'poll'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Zap className="h-4 w-4" />
                    <span>โพลแบบสำรวจ</span>
                  </button>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">หมวดหมู่</label>
                <div className="flex flex-wrap gap-2">
                  {requestForm.postType === 'poll'
                    ? ['โพลสำรวจความเห็น', 'กิจกรรม', 'ถาม-ตอบ', 'ทั่วไป'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setRequestForm((f) => ({ ...f, category: cat }))}
                          className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
                            requestForm.category === cat
                              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                              : 'bg-white text-slate-500 border-slate-200 hover:border-purple-300'
                          }`}
                        >
                          {cat}
                        </button>
                      ))
                    : ['ทั่วไป', 'กิจกรรม', 'ประชาสัมพันธ์', 'ประกาศ', 'ถาม-ตอบ'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setRequestForm((f) => ({ ...f, category: cat }))}
                          className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
                            requestForm.category === cat
                              ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm'
                              : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                </div>
              </div>

              {/* Title / Question */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  {requestForm.postType === 'poll' ? 'คำถามโพลแบบสำรวจ' : 'หัวข้อโพสต์'} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={requestForm.title}
                  onChange={(e) =>
                    setRequestForm((f) => ({
                      ...f,
                      title: e.target.value,
                      pollQuestion: f.postType === 'poll' ? e.target.value : f.pollQuestion,
                    }))
                  }
                  placeholder={
                    requestForm.postType === 'poll'
                      ? 'เช่น อยากให้จัดกิจกรรมคืนสู่เหย้าในธีมแบบไหน?'
                      : 'ใส่หัวข้อโพสต์...'
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Poll Specific: Dynamic Options List */}
              {requestForm.postType === 'poll' && (
                <div className="space-y-3 rounded-2xl border border-purple-100 bg-purple-50/40 p-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <span>ตัวเลือกคำตอบ (อย่างน้อย 2 ตัวเลือก)</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[11px] font-semibold text-purple-600">
                      {requestForm.pollOptions.length}/6 ตัวเลือก
                    </span>
                  </div>

                  <div className="space-y-2">
                    {requestForm.pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-purple-100 font-bold text-xs text-purple-700">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          required
                          maxLength={60}
                          value={opt}
                          onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                          placeholder={`ตัวเลือกที่ ${idx + 1}...`}
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
                        />
                        {requestForm.pollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePollOption(idx)}
                            className="rounded-full p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                            title="ลบตัวเลือกนี้"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {requestForm.pollOptions.length < 6 && (
                    <button
                      type="button"
                      onClick={handleAddPollOption}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-purple-300 bg-white/80 py-2 text-xs font-bold text-purple-600 hover:bg-purple-50 transition-colors"
                    >
                      <span>+ เพิ่มตัวเลือก</span>
                    </button>
                  )}

                  {/* Points per vote reward */}
                  <div className="pt-2 border-t border-purple-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-purple-800">แต้มสะสมเมื่อร่วมโหวต:</span>
                    <div className="flex gap-1.5">
                      {[3, 5, 10].map((pts) => (
                        <button
                          key={pts}
                          type="button"
                          onClick={() => setRequestForm((f) => ({ ...f, pointsPerVote: pts }))}
                          className={`rounded-full px-3 py-0.5 text-xs font-bold border transition-all ${
                            requestForm.pointsPerVote === pts
                              ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                              : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'
                          }`}
                        >
                          +{pts} แต้ม
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Content / Additional Details */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  {requestForm.postType === 'poll' ? 'รายละเอียดเพิ่มเติม (ไม่บังคับ)' : 'เนื้อหาโพสต์'}{' '}
                  {requestForm.postType === 'normal' && <span className="text-rose-400">*</span>}
                </label>
                <textarea
                  required={requestForm.postType === 'normal'}
                  rows={requestForm.postType === 'poll' ? 2 : 4}
                  maxLength={1000}
                  value={requestForm.content}
                  onChange={(e) => setRequestForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder={
                    requestForm.postType === 'poll'
                      ? 'อธิบายรายละเอียดของโพลแบบสำรวจนี้เพิ่มเติม...'
                      : 'อธิบายเนื้อหาโพสต์ที่ต้องการให้แอดมินช่วยสร้าง...'
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                />
                <p className="text-right text-xs text-slate-400 mt-1">{requestForm.content.length}/1000</p>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestForm(false);
                    setRequestForm({
                      postType: 'normal',
                      title: '',
                      content: '',
                      category: 'ทั่วไป',
                      pollQuestion: '',
                      pollOptions: ['', ''],
                      pointsPerVote: 5,
                    });
                    setRequestStatus('idle');
                  }}
                  className="rounded-full border border-slate-200 px-5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  disabled={
                    requestStatus === 'submitting' ||
                    !requestForm.title.trim() ||
                    (requestForm.postType === 'normal' && !requestForm.content.trim()) ||
                    (requestForm.postType === 'poll' &&
                      requestForm.pollOptions.filter((o) => o.trim().length > 0).length < 2)
                  }
                  className={`flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold transition-all shadow-sm ${
                    requestStatus === 'success'
                      ? 'bg-emerald-500 text-white'
                      : requestStatus === 'error'
                      ? 'bg-rose-500 text-white'
                      : requestForm.postType === 'poll'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 disabled:opacity-40'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 disabled:opacity-40'
                  }`}
                >
                  {requestStatus === 'submitting' ? (
                    <><span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> กำลังส่ง...</>
                  ) : requestStatus === 'success' ? (
                    <><CheckCircle2 className="h-4 w-4" /> ส่งคำขอสำเร็จแล้ว ✨</>
                  ) : requestStatus === 'error' ? (
                    '⚠️ เกิดข้อผิดพลาด ลองใหม่'
                  ) : requestForm.postType === 'poll' ? (
                    <><Zap className="h-4 w-4" /> ส่งคำขอสร้างโพลแบบสำรวจ</>
                  ) : (
                    <><Send className="h-4 w-4" /> ส่งคำขอโพสต์</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ===== POST CARDS ===== */}
        {feedPosts.length === 0 ? (
          <div className="rounded-[32px] border border-slate-100 bg-white p-20 text-center text-slate-400 shadow-xs">
            <Sparkles className="mx-auto h-12 w-12 text-pink-300 animate-pulse" />
            <p className="mt-4 text-base font-medium">ยังไม่มีโพสต์บนวอลล์ในขณะนี้</p>
          </div>
        ) : (
          feedPosts.map((post) => {
            const isLiked = post.likedUserIds?.includes(currentUserId);
            const currentEmoji = post.selectedEmoji || (isLiked ? '💖' : '💖');
            const isMenuOpen = activePostMenuId === post.id;

            return (
              <div
                id={`post-${post.id}`}
                key={post.id}
                className="rounded-[32px] border border-slate-200/90 bg-white shadow-card transition-all duration-200 overflow-hidden relative"
              >
                {/* Post Header */}
                <div className="p-7 sm:p-8">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-100 via-pink-100 to-rose-100 border border-purple-200/50 text-purple-700 font-extrabold text-base shadow-2xs">
                        {post.author ? post.author.substring(0, 2) : 'CS'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-base sm:text-lg">{post.author || 'แอดมินระบบ'}</h4>
                          {post.isAvailableForMentorship && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                              💬 ยินดีให้คำแนะนำ
                            </span>
                          )}
                          {post.pinned && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-3 py-0.5 text-xs font-semibold text-pink-600 border border-pink-100">
                              <Pin className="h-3.5 w-3.5" /> ปักหมุด
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 mt-1">
                          <span>{new Date(post.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span>•</span>
                          {post.category && (
                            <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-medium text-slate-600">
                              {post.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Post Header Right: Admin Quick Action & Dropdown Menu */}
                    <div className="flex items-center gap-2 relative">
                      {/* Admin Quick Delete Button */}
                      {activeRole === 'admin' && (
                        <button
                          onClick={() => setPostToDelete(post)}
                          className="flex items-center gap-1.5 rounded-full bg-rose-50 hover:bg-rose-100/90 text-rose-600 border border-rose-200/90 px-3.5 py-1.5 text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-2xs"
                          title="ลบโพสต์ข่าวนี้ (เฉพาะแอดมิน)"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                          <span>ลบโพสต์</span>
                        </button>
                      )}

                      {/* 3-Dots Options Menu Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePostMenuId(isMenuOpen ? null : post.id);
                        }}
                        className={`rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors ${
                          isMenuOpen ? 'bg-slate-100 text-slate-700' : ''
                        }`}
                        title="ตัวเลือกเพิ่มเติม"
                      >
                        <MoreHorizontal className="h-6 w-6" />
                      </button>

                      {/* Options Dropdown Popover */}
                      {isMenuOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-12 z-30 w-52 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-hero animate-fade-in text-xs font-medium"
                        >
                          <button
                            onClick={() => {
                              handleShare(post.id);
                              setActivePostMenuId(null);
                            }}
                            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors text-left"
                          >
                            <Share2 className="h-4 w-4 text-slate-400" />
                            <span>คัดลอกลิงก์โพสต์</span>
                          </button>

                          {activeRole === 'admin' ? (
                            <>
                              <div className="my-1 border-t border-slate-100" />
                              <button
                                onClick={() => {
                                  setActivePostMenuId(null);
                                  setPostToDelete(post);
                                }}
                                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-rose-600 hover:bg-rose-50 font-bold transition-colors text-left"
                              >
                                <Trash2 className="h-4 w-4 text-rose-500" />
                                <span>ลบโพสต์นี้ (Admin)</span>
                              </button>
                            </>
                          ) : (
                            <div className="px-3 py-2 text-[11px] text-slate-400 border-t border-slate-100 mt-1">
                              เฉพาะแอดมินสามารถลบโพสต์ได้
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>


                  {/* Post Content Box */}
                  <div className="mt-6 space-y-3 bg-slate-50/70 rounded-2xl p-6 sm:p-7 border border-slate-200/70 shadow-xs/30">
                    {post.title && (
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">{post.title}</h3>
                    )}
                    <p className="text-base sm:text-lg leading-relaxed text-slate-700 whitespace-pre-line">{post.body}</p>
                  </div>

                  {/* Poll Box (Interactive Real Voting) */}
                  {post.poll && (() => {
                    const poll = post.poll;
                    const totalVotes = poll.options.reduce((sum, o) => sum + (o.votes || 0), 0);
                    const userVote = poll.userVotes?.find((v) => v.user_id === currentUserId);
                    const hasVoted = Boolean(
                      poll.votedUserIds?.includes(currentUserId) || userVote
                    );

                    return (
                      <div className="mt-5 rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-50/60 via-white to-pink-50/40 p-5 sm:p-6 shadow-xs">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
                            <Zap className="h-4 w-4" /> โพลแบบสำรวจ
                          </p>
                          <span className="rounded-full bg-purple-100/90 text-purple-700 px-2.5 py-0.5 text-xs font-bold border border-purple-200/60">
                            +{poll.pointsPerVote ?? 5} แต้ม
                          </span>
                        </div>

                        <p className="text-base sm:text-lg font-bold text-slate-800 mb-4">{poll.question}</p>

                        <div className="space-y-3">
                          {poll.options.map((opt) => {
                            const percent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                            const isMyChoice = userVote?.option_id === opt.id;

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                disabled={hasVoted}
                                onClick={(e) => handleVotePoll(post.id, poll.id, opt.id, e)}
                                className={`w-full relative overflow-hidden rounded-xl border text-left transition-all duration-300 p-4 shadow-2xs group ${
                                  hasVoted
                                    ? isMyChoice
                                      ? 'border-purple-300 bg-purple-50/30'
                                      : 'border-slate-200/70 bg-white/80 opacity-90'
                                    : 'border-purple-100/80 bg-white hover:border-purple-300 hover:bg-purple-50/30 hover:shadow-xs active:scale-[0.99] cursor-pointer'
                                }`}
                              >
                                {/* Animated Progress Fill Bar */}
                                {hasVoted && (
                                  <div
                                    className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out rounded-r-lg ${
                                      isMyChoice
                                        ? 'bg-gradient-to-r from-purple-200/70 to-pink-200/60'
                                        : 'bg-slate-100/80'
                                    }`}
                                    style={{ width: `${percent}%` }}
                                  />
                                )}

                                <div className="relative z-10 flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                                      isMyChoice
                                        ? 'border-purple-500 bg-purple-500 text-white shadow-2xs'
                                        : hasVoted
                                        ? 'border-slate-300 bg-white text-slate-400'
                                        : 'border-slate-300 bg-white text-slate-500 group-hover:border-purple-400 group-hover:text-purple-600'
                                    }`}>
                                      {isMyChoice ? <Check className="h-3.5 w-3.5" /> : null}
                                    </div>
                                    <span className={`font-semibold text-sm sm:text-base truncate ${
                                      isMyChoice ? 'text-purple-900 font-bold' : 'text-slate-700'
                                    }`}>
                                      {opt.text}
                                    </span>
                                  </div>

                                  <div className="shrink-0 flex items-center gap-2">
                                    {hasVoted && (
                                      <span className={`text-xs font-extrabold ${isMyChoice ? 'text-purple-700' : 'text-slate-500'}`}>
                                        {percent}%
                                      </span>
                                    )}
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                      isMyChoice
                                        ? 'bg-purple-200/80 text-purple-800'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {opt.votes} โหวต
                                    </span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Poll Footer Summary */}
                        <div className="mt-3.5 flex items-center justify-between text-xs text-slate-400 px-1">
                          <span>
                            {hasVoted ? (
                              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> คุณได้ร่วมโหวตแล้ว
                              </span>
                            ) : (
                              'แตะที่ตัวเลือกเพื่อลงคะแนน'
                            )}
                          </span>
                          <span className="font-medium text-slate-500">รวม {totalVotes} คะแนนโหวต</span>
                        </div>
                      </div>
                    );
                  })()}


                  {/* Cute Reaction Stats Bar */}
                  <div className="mt-5 flex items-center justify-between text-xs sm:text-sm text-slate-400 px-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-500">
                        <Heart className="h-3.5 w-3.5 fill-current" />
                      </span>
                      <span className="font-medium text-slate-600">
                        {post.likes > 0 ? `${isLiked ? 'คุณ และอีก ' : ''}${post.likes} คนส่งความรัก` : 'ส่งความรักคนแรก'}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleCommentBox(post.id)}
                      className="hover:text-pink-600 hover:underline cursor-pointer transition-colors font-medium"
                    >
                      {typeof post.comments === 'number'
                        ? post.comments
                        : Array.isArray((post as any).comments)
                        ? (post as any).comments.length
                        : (post.commentsList?.length ?? 0)}{' '}
                      ความคิดเห็น
                    </button>
                  </div>

                  {/* ===== ACTION BUTTONS & EMOJI REACTION POPUP ===== */}
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-sm sm:text-base font-medium relative">

                    {/* Cute Emoji Reaction Popup Picker */}
                    {activeReactionPicker === post.id && (
                      <div className="absolute left-0 -top-14 z-20 flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-md border border-pink-100 animate-fade-in">
                        {EMOJI_REACTIONS.map((item) => (
                          <button
                            key={item.emoji}
                            onClick={(e) => handleSelectEmojiReaction(post.id, item, e)}
                            title={item.label}
                            className="text-2xl transition-transform hover:scale-135 hover:-translate-y-1 active:scale-100 p-1"
                          >
                            {item.emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex-1 relative">
                      <button
                        onClick={(e) => handleToggleLike(post.id, e)}
                        onMouseEnter={() => setActiveReactionPicker(post.id)}
                        className={`w-full flex items-center justify-center gap-2 rounded-full py-3 transition-all ${isLiked
                            ? 'bg-rose-50 text-rose-500 font-bold shadow-2xs'
                            : 'bg-slate-50 text-slate-600 hover:bg-rose-50/60 hover:text-rose-500'
                          }`}
                      >
                        <span className="text-lg">{currentEmoji}</span>
                        <span>{isLiked ? 'ถูกใจแล้ว' : 'ส่งหัวใจ'}</span>
                      </button>
                    </div>

                    <button
                      onClick={() => toggleCommentBox(post.id)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 bg-slate-50 text-slate-600 hover:bg-purple-50/60 hover:text-purple-600 transition-all"
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span>คอมเมนต์</span>
                    </button>

                    <button
                      onClick={() => handleShare(post.id)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 bg-slate-50 text-slate-600 hover:bg-sky-50/60 hover:text-sky-600 transition-all"
                    >
                      <Share2 className="h-5 w-5" />
                      <span>{copiedId === post.id ? 'ก๊อปแล้ว ✨' : 'แชร์'}</span>
                    </button>
                  </div>

                  {/* ===== CUTE COMMENTS BUBBLE SECTION ===== */}
                  {openComments[post.id] && (
                    <div className="mt-5 border-t border-slate-100 pt-4 space-y-4 bg-slate-50/40 rounded-2xl p-4 sm:p-5">
                      {/* Comments List */}
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {post.commentsList && post.commentsList.length > 0 ? (
                          post.commentsList.map((comment) => {
                            const cLike = commentLikes[comment.id] ?? { count: 0, likedByMe: false, emoji: '❤️' };
                            const isCommentPickerOpen = activeCommentReactionPicker === comment.id;
                            return (
                              <div key={comment.id} className="flex items-start gap-2.5">
                                {/* Avatar */}
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-300 to-purple-300 font-bold text-white text-xs mt-0.5 shadow-sm">
                                  {comment.author ? comment.author.substring(0, 2) : 'CS'}
                                </div>
                                {/* Bubble + actions */}
                                <div className="flex-1 min-w-0">
                                  <div className="relative inline-block max-w-full">
                                    {/* Emoji Picker for comment */}
                                    {isCommentPickerOpen && (
                                      <div
                                        className="absolute left-0 -top-11 z-30 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-lg border border-slate-200 animate-fade-in"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {EMOJI_REACTIONS.map((item) => (
                                          <button
                                            key={item.emoji}
                                            title={item.label}
                                            onClick={() => {
                                              setCommentLikes((prev) => ({
                                                ...prev,
                                                [comment.id]: {
                                                  count: cLike.likedByMe ? cLike.count : cLike.count + 1,
                                                  likedByMe: true,
                                                  emoji: item.emoji,
                                                },
                                              }));
                                              setActiveCommentReactionPicker(null);
                                            }}
                                            className="text-lg hover:scale-125 transition-transform"
                                          >
                                            {item.emoji}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                    {/* Comment bubble */}
                                    <div className="rounded-2xl rounded-tl-xs bg-white px-4 py-2.5 shadow-sm border border-slate-100">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <p className="text-xs font-bold text-indigo-700">{comment.author}</p>
                                        {comment.isAvailableForMentorship && (
                                          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                                            💬 ยินดีให้คำแนะนำ
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs sm:text-sm text-slate-700 mt-0.5 whitespace-pre-line">{comment.content}</p>
                                      {/* Like count badge on bubble */}
                                      {cLike.count > 0 && (
                                        <span className="inline-flex items-center gap-0.5 mt-1.5 rounded-full bg-rose-50 border border-rose-100 px-1.5 py-0.5 text-xs text-rose-500 font-semibold">
                                          {cLike.emoji} {cLike.count}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Sub-actions row: time · like · reply */}
                                  <div className="flex items-center gap-3 mt-1 pl-1">
                                    <span className="text-xs text-slate-400">
                                      {new Date(comment.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                    </span>

                                    {/* Like button with emoji picker on hover */}
                                    <div className="relative">
                                      <button
                                        onMouseEnter={() => setActiveCommentReactionPicker(comment.id)}
                                        onMouseLeave={() =>
                                          setTimeout(() => setActiveCommentReactionPicker((cur) => (cur === comment.id ? null : cur)), 300)
                                        }
                                        onClick={() => {
                                          // toggle like with current emoji
                                          setCommentLikes((prev) => {
                                            const cur = prev[comment.id] ?? { count: 0, likedByMe: false, emoji: '❤️' };
                                            return {
                                              ...prev,
                                              [comment.id]: {
                                                count: cur.likedByMe ? cur.count - 1 : cur.count + 1,
                                                likedByMe: !cur.likedByMe,
                                                emoji: cur.emoji,
                                              },
                                            };
                                          });
                                        }}
                                        className={`text-xs font-semibold transition-colors ${
                                          cLike.likedByMe ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'
                                        }`}
                                      >
                                        {cLike.likedByMe ? `${cLike.emoji} ถูกใจแล้ว` : '❤️ ถูกใจ'}
                                      </button>
                                    </div>

                                    {/* Reply button */}
                                    <button
                                      onClick={() => {
                                        setReplyTargets((prev) => ({
                                          ...prev,
                                          [post.id]: { commentId: comment.id, authorName: comment.author },
                                        }));
                                        setCommentInputs((prev) => ({
                                          ...prev,
                                          [post.id]: `@${comment.author} `,
                                        }));
                                      }}
                                      className="text-xs font-semibold text-slate-400 hover:text-indigo-500 transition-colors"
                                    >
                                      ↩ ตอบกลับ
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-center text-xs text-slate-400 py-3">ยังไม่มีคอมเมนต์ มาส่งความคิดเห็นคนแรกกันเถอะ ✨</p>
                        )}
                      </div>

                      {/* Reply Target Banner */}
                      {replyTargets[post.id] && (
                        <div className="flex items-center justify-between rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-1.5">
                          <span className="text-xs text-indigo-600 font-medium">
                            ↩ กำลังตอบกลับ <span className="font-bold">{replyTargets[post.id]?.authorName}</span>
                          </span>
                          <button
                            onClick={() => {
                              setReplyTargets((prev) => ({ ...prev, [post.id]: null }));
                              setCommentInputs((prev) => ({ ...prev, [post.id]: '' }));
                            }}
                            className="text-xs text-slate-400 hover:text-slate-600 ml-2"
                          >
                            ✕ ยกเลิก
                          </button>
                        </div>
                      )}

                      {/* Comment Input */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200/40">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-400 to-purple-400 font-bold text-white text-xs">
                          CS
                        </div>
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={commentInputs[post.id] || ''}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddComment(post.id);
                                setReplyTargets((prev) => ({ ...prev, [post.id]: null }));
                              }
                            }}
                            placeholder={replyTargets[post.id] ? `ตอบกลับ ${replyTargets[post.id]?.authorName}...` : 'เขียนความคิดเห็น...'}
                            className="w-full rounded-full border border-slate-200 bg-white py-2 pl-4 pr-10 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          />
                          <button
                            onClick={() => {
                              handleAddComment(post.id);
                              setReplyTargets((prev) => ({ ...prev, [post.id]: null }));
                            }}
                            disabled={submittingComment[post.id] || !commentInputs[post.id]?.trim()}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-indigo-500 hover:bg-indigo-50 disabled:opacity-30 transition-all"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ===== RIGHT SIDEBAR: INDEPENDENTLY SCROLLABLE WITH MOUSE ===== */}
      <aside className="space-y-4 sticky top-[80px] max-h-[calc(100vh-100px)] overflow-y-auto pr-1 hover:pr-0.5 transition-all">

        {/* 🔮 FUN WIDGET: DAILY ALUMNI FORTUNE / QUOTE WHEEL */}
        <div className="rounded-[26px] border border-purple-200/70 bg-gradient-to-br from-purple-50/70 via-white to-pink-50/40 p-4.5 shadow-card transition-all duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span>เซียมซีศิษย์เก่าประจำวัน 🔮</span>
            </h3>
            <button
              onClick={handleSpinFortune}
              disabled={isSpinningFortune}
              className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-700 hover:bg-purple-200 transition-colors flex items-center gap-1 active:scale-95"
            >
              <Dices className={`h-3 w-3 ${isSpinningFortune ? 'animate-spin' : ''}`} />
              <span>สุ่มดวง</span>
            </button>
          </div>

          <div className="mt-3 rounded-2xl border border-purple-100/70 bg-white p-3.5 text-center shadow-2xs">
            <p className="text-xs font-semibold text-purple-800 leading-relaxed transition-all">
              {ALUMNI_FORTUNES[fortuneIndex]}
            </p>
          </div>
        </div>


        {/* 1. Stats Widget */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-card transition-all duration-200 text-center">
            <p className="text-xs font-medium text-slate-400">ศิษย์เก่าในระบบ</p>
            <p className="mt-0.5 text-lg font-extrabold text-slate-800">{stats?.totalAlumni ?? stats?.approvedUsers ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-card transition-all duration-200 text-center">
            <p className="text-xs font-medium text-slate-400">ศิษย์เก่าดีเด่น</p>
            <p className="mt-0.5 text-lg font-extrabold text-pink-500">{stats?.outstandingAlumni ?? 0}</p>
          </div>
        </div>

        {/* 2. Gallery Widget */}
        <div className="rounded-[26px] border border-purple-200/70 bg-white p-4.5 shadow-card transition-all duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 text-purple-400" />
              <span>คลังภาพกิจกรรม</span>
            </h3>
            <Link href="/gallery" className="text-xs font-medium text-pink-500 hover:underline">
              ดูทั้งหมด
            </Link>
          </div>
          <div className="mt-2.5 space-y-2">
            {latestPhotos.length === 0 ? (
              <p className="text-xs text-slate-400 py-2 text-center">ไม่มีรูปภาพล่าสุด</p>
            ) : (
              latestPhotos.slice(0, 2).map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-purple-50/30 border border-purple-50 p-2 hover:bg-purple-50 transition-colors">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                    <ImageIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-slate-700 truncate">{item.title || 'รูปกิจกรรม'}</p>
                    <p className="text-xs text-slate-400">{item.caption || 'คลังภาพศิษย์เก่า'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. 🎂 CUTE BIRTHDAY WALL WIDGET */}
        <div className="rounded-[26px] border border-pink-200/70 bg-gradient-to-b from-pink-50/60 via-white to-white p-4.5 shadow-card transition-all duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <PartyPopper className="h-4 w-4 text-pink-500" />
              <span>สุขสันต์วันเกิดเดือนนี้ 🎉</span>
            </h3>
            <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-bold text-pink-600">
              ส.ค. 2026
            </span>
          </div>

          <div className="mt-2.5 space-y-2">
            {BIRTHDAY_ALUMNI.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-pink-100/60 bg-white p-2 shadow-2xs hover:border-pink-200 transition-all"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-pink-400 to-rose-400 font-bold text-white text-xs shadow-2xs">
                    {item.avatar}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.gen} • 🎂 {item.date}</p>
                  </div>
                </div>

                <button
                  onClick={(e) => handleSendWish(item.id, e)}
                  disabled={wishedIds[item.id]}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all ${wishedIds[item.id]
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-2xs hover:opacity-90 active:scale-95'
                    }`}
                >
                  {wishedIds[item.id] ? 'ส่งแล้ว ✨' : '🎉 อวยพร'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 5. 🏆 TOP ACTIVE MEMBERS LEADERBOARD WIDGET */}
        <div className="rounded-[26px] border border-amber-200/70 bg-gradient-to-b from-amber-50/50 via-white to-white p-4.5 shadow-card transition-all duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span>อันดับกิจกรรมประจำเดือน 🏆</span>
            </h3>
            <span className="text-xs font-medium text-slate-400">Top 3</span>
          </div>

          <div className="mt-2.5 space-y-2">
            {TOP_LEADERBOARD.map((item) => (
              <div
                key={item.rank}
                className={`flex items-center justify-between rounded-2xl p-2 border transition-all ${item.rank === 1
                    ? 'bg-gradient-to-r from-amber-50/80 to-amber-100/40 border-amber-200 shadow-2xs'
                    : item.rank === 2
                      ? 'bg-slate-50/80 border-slate-200'
                      : 'bg-orange-50/40 border-orange-100'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm shrink-0">{item.badge}</span>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-white text-xs">
                    {item.avatar}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.gen}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-extrabold text-amber-600">{item.points}</p>
                  <p className="text-xs text-slate-400">พอยท์</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ===== CUTE FLOATING TOAST NOTIFICATION ===== */}
      {deleteToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-pop-in">
          <div className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-hero border backdrop-blur-md text-sm font-semibold ${
            deleteToast.type === 'success'
              ? 'bg-emerald-50/95 text-emerald-800 border-emerald-200 shadow-emerald-500/10'
              : 'bg-rose-50/95 text-rose-800 border-rose-200 shadow-rose-500/10'
          }`}>
            {deleteToast.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            )}
            <span>{deleteToast.message}</span>
            <button
              onClick={() => setDeleteToast(null)}
              className="ml-2 rounded-full p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ===== CUTE GLASSMORPHISM DELETE CONFIRMATION MODAL ===== */}
      {postToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-lg rounded-[32px] border border-rose-100 bg-white p-7 sm:p-8 shadow-hero animate-scale-up space-y-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500" />

            {/* Modal Header */}
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100/80 text-rose-600 shadow-2xs">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">ยืนยันการลบโพสต์ข่าว</h3>
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 border border-rose-200">
                    Admin Only
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  คุณกำลังจะลบโพสต์นี้ออกจากวอลล์/ฟีดของระบบ
                </p>
              </div>
              <button
                onClick={() => {
                  if (!isDeletingPost) setPostToDelete(null);
                }}
                disabled={isDeletingPost}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Post Preview Box */}
            <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="font-semibold text-rose-700">ผู้โพสต์: {postToDelete.author || 'แอดมิน'}</span>
                {postToDelete.category && (
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-rose-100">
                    {postToDelete.category}
                  </span>
                )}
              </div>
              {postToDelete.title && (
                <p className="font-bold text-slate-900 text-sm">{postToDelete.title}</p>
              )}
              <p className="text-slate-600 line-clamp-3 leading-relaxed">
                {postToDelete.body}
              </p>
            </div>

            {/* Warning Details */}
            <div className="rounded-2xl bg-amber-50/80 border border-amber-200/80 p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">คำเตือนการลบข้อมูลถาวร</p>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  การลบโพสต์นี้จะลบคอมเมนต์, การส่งความรัก (Likes) และผลโหวตที่เกี่ยวข้องทั้งหมด และไม่สามารถกู้คืนได้
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPostToDelete(null)}
                disabled={isDeletingPost}
                className="rounded-full border border-slate-200 px-6 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={confirmDeletePost}
                disabled={isDeletingPost}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:from-rose-700 hover:to-pink-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {isDeletingPost ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    <span>กำลังลบโพสต์...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>ยืนยันลบโพสต์</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}