'use client';

import { useState } from 'react';
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
  Newspaper,
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
  Volume2
} from 'lucide-react';

interface Comment {
  id: number;
  content: string;
  created_at: string;
  author: string;
  avatar_url?: string;
  parentCommentId?: number | null;
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
  poll?: {
    question: string;
    pointsPerVote?: number;
    options: { id: number; text: string; votes: number }[];
  };
}

interface FeedListProps {
  posts: Post[];
  stats: any;
  latestPhotos?: any[];
  featuredAlumni?: any[];
  currentUserId: number;
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

// Random Alumni Profiles for Icebreaker
const RANDOM_ALUMNI_POOL = [
  { name: 'พี่ธนกร สายลุย', gen: 'รุ่น 39', job: 'Senior Backend Dev @ Agoda', bio: 'ยินดีให้คำปรึกษาเรื่อง Node.js & Go ครับ!' },
  { name: 'พี่ภัทรวดี อินดี้', gen: 'รุ่น 42', job: 'UX/UI Designer @ Shopee', bio: 'ทักมาคุยเรื่องดีไซน์หรือรีวิว พอร์ตฟอลิโอได้น้า ✨' },
  { name: 'พี่ชูเกียรติ ก้าวไกล', gen: 'รุ่น 36', job: 'DevOps Engineer @ Line Thailand', bio: 'สาย Cloud / Kubernetes มาคุยแลกเปลี่ยนกันได้เลย' },
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
  currentUserId
}: FeedListProps) {
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
  const [randomAlumnusIdx, setRandomAlumnusIdx] = useState<number>(0);

  // Radial Burst Particle State
  const [floatingHearts, setFloatingHearts] = useState<BurstParticle[]>([]);

  // ─── Comment Like & Reply State ───────────────────────────────────
  const [commentLikes, setCommentLikes] = useState<Record<number, { count: number; likedByMe: boolean; emoji: string }>>({});
  const [activeCommentReactionPicker, setActiveCommentReactionPicker] = useState<number | null>(null);
  const [replyTargets, setReplyTargets] = useState<Record<number, { commentId: number; authorName: string } | null>>({});

  // ─── Post Request Form State ──────────────────────────────────────
  const [showRequestForm, setShowRequestForm] = useState<boolean>(false);
  const [requestForm, setRequestForm] = useState({ title: '', content: '', category: '' });
  const [requestStatus, setRequestStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  async function handleSubmitPostRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!requestForm.title.trim() || !requestForm.content.trim()) return;
    setRequestStatus('submitting');
    try {
      const res = await fetch('/api/feed/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedBy: currentUserId,
          title: requestForm.title.trim(),
          content: requestForm.content.trim(),
          category: requestForm.category.trim() || 'ทั่วไป',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRequestStatus('success');
        setRequestForm({ title: '', content: '', category: '' });
        setTimeout(() => {
          setRequestStatus('idle');
          setShowRequestForm(false);
        }, 2500);
      } else {
        setRequestStatus('error');
        setTimeout(() => setRequestStatus('idle'), 3000);
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

  // Randomize Alumnus
  function handleNextRandomAlumnus() {
    setRandomAlumnusIdx((prev) => (prev + 1) % RANDOM_ALUMNI_POOL.length);
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
      author: 'ศิษย์เก่า',
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

  const currentRandomAlumnus = RANDOM_ALUMNI_POOL[randomAlumnusIdx];

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
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">หมวดหมู่</label>
                <div className="flex flex-wrap gap-2">
                  {['ทั่วไป', 'กิจกรรม', 'ประชาสัมพันธ์', 'ประกาศ', 'ถาม-ตอบ'].map((cat) => (
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

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">หัวข้อโพสต์ <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={requestForm.title}
                  onChange={(e) => setRequestForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="ใส่หัวข้อโพสต์..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">เนื้อหา <span className="text-rose-400">*</span></label>
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  value={requestForm.content}
                  onChange={(e) => setRequestForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="อธิบายเนื้อหาโพสต์ที่ต้องการให้แอดมินช่วยสร้าง..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                />
                <p className="text-right text-xs text-slate-400 mt-1">{requestForm.content.length}/1000</p>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => { setShowRequestForm(false); setRequestForm({ title: '', content: '', category: '' }); setRequestStatus('idle'); }}
                  className="rounded-full border border-slate-200 px-5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={requestStatus === 'submitting' || !requestForm.title.trim() || !requestForm.content.trim()}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-full py-2 text-sm font-bold transition-all shadow-sm ${
                    requestStatus === 'success'
                      ? 'bg-emerald-500 text-white'
                      : requestStatus === 'error'
                      ? 'bg-rose-500 text-white'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 disabled:opacity-40'
                  }`}
                >
                  {requestStatus === 'submitting' ? (
                    <><span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> กำลังส่ง...</>
                  ) : requestStatus === 'success' ? (
                    <><CheckCircle2 className="h-4 w-4" /> ส่งคำขอแล้ว ✨</>
                  ) : requestStatus === 'error' ? (
                    '⚠️ เกิดข้อผิดพลาด ลองใหม่'
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

            return (
              <div
                id={`post-${post.id}`}
                key={post.id}
                className="rounded-[32px] border border-slate-200/90 bg-white shadow-card transition-all duration-200 overflow-hidden relative"
              >
                {/* Post Header */}
                <div className="p-7 sm:p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-100 via-pink-100 to-rose-100 border border-purple-200/50 text-purple-700 font-extrabold text-base shadow-2xs">
                        {post.author ? post.author.substring(0, 2) : 'CS'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h4 className="font-bold text-slate-900 text-base sm:text-lg">{post.author || 'แอดมินระบบ'}</h4>
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

                    <button className="rounded-full p-2 text-slate-300 hover:bg-slate-50 hover:text-slate-500 transition-colors">
                      <MoreHorizontal className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Post Content Box */}
                  <div className="mt-6 space-y-3 bg-slate-50/70 rounded-2xl p-6 sm:p-7 border border-slate-200/70 shadow-xs/30">
                    {post.title && (
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">{post.title}</h3>
                    )}
                    <p className="text-base sm:text-lg leading-relaxed text-slate-700 whitespace-pre-line">{post.body}</p>
                  </div>

                  {/* Poll Box (if applicable) */}
                  {post.poll && (
                    <div className="mt-5 rounded-2xl border border-purple-100 bg-purple-50/40 p-5 sm:p-6">
                      <p className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Zap className="h-4 w-4" /> โพลแบบสำรวจ
                      </p>
                      <p className="text-base font-bold text-slate-800 mb-3.5">{post.poll.question}</p>
                      <div className="space-y-3">
                        {post.poll.options.map((opt) => (
                          <div
                            key={opt.id}
                            className="flex items-center justify-between rounded-xl border border-purple-100 bg-white px-5 py-3 text-sm sm:text-base transition-all hover:border-purple-300 shadow-2xs cursor-pointer active:scale-98"
                          >
                            <span className="text-slate-700 font-semibold">{opt.text}</span>
                            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                              {opt.votes} โหวต
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
                      {post.comments} ความคิดเห็น
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
                                      <p className="text-xs font-bold text-indigo-700">{comment.author}</p>
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

        {/* 🤝 FUN WIDGET: RANDOM ALUMNI ICEBREAKER */}
        <div className="rounded-[26px] border border-sky-200/70 bg-gradient-to-br from-sky-50/60 via-white to-white p-4.5 shadow-card transition-all duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Smile className="h-4 w-4 text-sky-500" />
              <span>ทำความรู้จักศิษย์เก่า 🤝</span>
            </h3>
            <button
              onClick={handleNextRandomAlumnus}
              className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-700 hover:bg-sky-200 transition-colors flex items-center gap-1 active:scale-95"
            >
              <Dices className="h-3 w-3" />
              <span>สุ่มเปลี่ยน</span>
            </button>
          </div>

          <div className="mt-3 rounded-2xl border border-sky-100/60 bg-white p-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-sky-400 to-indigo-400 font-bold text-white text-xs shadow-2xs">
                {currentRandomAlumnus.name.substring(0, 2)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 truncate">{currentRandomAlumnus.name}</p>
                <p className="text-xs font-medium text-sky-600 truncate">{currentRandomAlumnus.job}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-xl p-2 italic">
              "{currentRandomAlumnus.bio}"
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

        {/* 3. Featured Alumni Widget */}
        <div className="rounded-[26px] border border-slate-100 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>ศิษย์เก่าแนะนำ</span>
            </h3>
            <Link href="/hall-of-fame" className="text-xs font-medium text-pink-500 hover:underline">
              ดูทั้งหมด
            </Link>
          </div>
          <div className="mt-2.5 space-y-2">
            {featuredAlumni.length === 0 ? (
              <p className="text-xs text-slate-400 py-2 text-center">ไม่มีข้อมูลศิษย์เก่าแนะนำ</p>
            ) : (
              featuredAlumni.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-center gap-2.5 rounded-2xl p-1.5 bg-slate-50/50 hover:bg-pink-50/30 border border-slate-100/60 transition-colors">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-amber-300 to-pink-400 font-bold text-white text-xs shadow-2xs">
                    {a.name ? a.name.substring(0, 2) : 'AL'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-800 truncate">{a.name}</p>
                    <p className="text-xs text-slate-400 truncate">{a.position || 'ศิษย์เก่า CS'}</p>
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
    </div>
  );
}