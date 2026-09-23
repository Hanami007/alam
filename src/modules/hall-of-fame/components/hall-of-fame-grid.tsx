'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { notifyPointsUpdated } from '@/lib/events';
import {
  Trophy,
  Crown,
  Medal,
  Search,
  Heart,
  Briefcase,
  Building2,
  CheckCircle2,
  Star,
  X,
  ChevronRight,
  Users,
  Sparkles,
  TrendingUp,
  Loader2,
  RotateCcw,
  LayoutList,
  LayoutGrid,
  Award,
  Flame,
  MapPin,
  Quote,
  Info,
  CalendarClock,
  HelpCircle,
  ChevronDown,
  GraduationCap,
} from 'lucide-react';

/* ═══════════════════════════════════════════════
   TYPE DEFINITIONS
═══════════════════════════════════════════════ */
export interface Candidate {
  id: number;
  name: string;
  studentId?: string;
  company: string;
  position: string;
  avatar_url: string;
  description: string;
  generation_label: string;
  generationNumber?: number;
  votes?: number;
  employmentType?: string;
}

interface HallOfFameGridProps {
  initialCandidates: Candidate[];
  /** สถานะแคมเปญ Hall of Fame ปัจจุบัน — ควบคุมโดยแอดมิน (เปิด/ปิดการโหวต) */
  campaignStatus?: 'open' | 'closed';
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export function HallOfFameGrid({ initialCandidates = [], campaignStatus = 'closed' }: HallOfFameGridProps) {
  const isVotingOpen = campaignStatus === 'open';
  /* ── Merged initial data: ข้อมูลจาก DB จริงเท่านั้น (dedupe + ใส่ default คะแนน) ── */
  const mergedInitial = useMemo<Candidate[]>(() => {
    const fromApi = (initialCandidates || []).map((c) => ({
      ...c,
      votes: typeof c.votes === 'number' ? c.votes : 0,
    }));

    const seenNames = new Set<string>();
    const uniqueFromApi: Candidate[] = [];
    for (const item of fromApi) {
      if (item.name && !seenNames.has(item.name.trim())) {
        seenNames.add(item.name.trim());
        uniqueFromApi.push(item);
      }
    }

    return uniqueFromApi.sort((a, b) => (b.votes || 0) - (a.votes || 0));
  }, [initialCandidates]);

  /* ── State ── */
  const [candidates, setCandidates] = useState<Candidate[]>(mergedInitial);
  const [query, setQuery] = useState('');
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [votedIds, setVotedIds] = useState<Record<number, boolean>>({});
  const [votingId, setVotingId] = useState<number | null>(null);
  const [voteAnimId, setVoteAnimId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const voteErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── popup "วิธีการโหวต" — โผล่ครั้งเดียวตอนเข้าหน้านี้ขณะเปิดโหวตอยู่ ── */
  const [showHowToVote, setShowHowToVote] = useState(isVotingOpen);
  useEffect(() => {
    if (isVotingOpen) setShowHowToVote(true);
  }, [isVotingOpen]);

  /* ── ตัวกรองรุ่น: กรองเฉพาะลิสต์อันดับ 4+ / ผลค้นหา (Top 3 ยังคงเป็นอันดับรวมทุกรุ่นเสมอ) ── */
  const [selectedGeneration, setSelectedGeneration] = useState<string>('all');
  const [isGenDropdownOpen, setIsGenDropdownOpen] = useState(false);
  const genDropdownRef = useRef<HTMLDivElement>(null);

  // ปิดดรอปดาวน์เลือกรุ่นเมื่อคลิกนอกกรอบ
  useEffect(() => {
    if (!isGenDropdownOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (genDropdownRef.current && !genDropdownRef.current.contains(event.target as Node)) {
        setIsGenDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isGenDropdownOpen]);

  useEffect(() => {
    return () => {
      if (voteErrorTimeoutRef.current) clearTimeout(voteErrorTimeoutRef.current);
    };
  }, []);

  /* ── Initialize / sync candidates once API data arrives ── */
  const hasInitializedApiRef = useRef(false);
  useEffect(() => {
    if (!hasInitializedApiRef.current && initialCandidates && initialCandidates.length > 0) {
      hasInitializedApiRef.current = true;
      setCandidates(mergedInitial);
    }
  }, [mergedInitial, initialCandidates]);

  /* ── แสดงข้อความแจ้งเตือนตอนโหวตไม่สำเร็จ (เช่น ใช้สิทธิ์โควตาหมดแล้ว) ── */
  function showVoteError(message: string) {
    if (voteErrorTimeoutRef.current) clearTimeout(voteErrorTimeoutRef.current);
    setVoteError(message);
    voteErrorTimeoutRef.current = setTimeout(() => setVoteError(null), 4000);
  }

  /* ── Vote handler: เพิ่มคะแนนโหวตให้คนที่โดนกดทันที (โควตา: ในรุ่นตัวเอง 1 + นอกรุ่นตัวเอง 1) ── */
  async function handleVote(e: React.MouseEvent, candidateId: number) {
    e.stopPropagation();
    if (votedIds[candidateId] || votingId !== null) return;
    setVotingId(candidateId);
    setVoteAnimId(candidateId);
    setTimeout(() => setVoteAnimId(null), 600);

    // อัปเดตคะแนนโหวตเพิ่มให้คนที่โดนกดทันที (+1 vote) แบบ optimistic
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, votes: (c.votes || 0) + 1 } : c))
    );
    setVotedIds((prev) => ({ ...prev, [candidateId]: true }));

    // ถ้าเปิด Modal คนนี้อยู่ ให้เพิ่มคะแนนใน Modal ด้วย
    if (selectedCandidate && selectedCandidate.id === candidateId) {
      setSelectedCandidate((prev) => (prev ? { ...prev, votes: (prev.votes || 0) + 1 } : null));
    }

    try {
      const res = await fetch('/api/hof/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId }),
      });
      const data = await res.json().catch(() => null);
      if (data?.success) {
        notifyPointsUpdated(data.pointsAwarded || 10);
      } else {
        // โหวตไม่สำเร็จ (เช่น ใช้สิทธิ์โควตาในรุ่น/นอกรุ่นไปแล้ว) → ย้อนคะแนนที่เพิ่มไปแบบ optimistic กลับ
        setCandidates((prev) =>
          prev.map((c) => (c.id === candidateId ? { ...c, votes: Math.max((c.votes || 1) - 1, 0) } : c))
        );
        setVotedIds((prev) => {
          const next = { ...prev };
          delete next[candidateId];
          return next;
        });
        if (selectedCandidate && selectedCandidate.id === candidateId) {
          setSelectedCandidate((prev) => (prev ? { ...prev, votes: Math.max((prev.votes || 1) - 1, 0) } : null));
        }
        showVoteError(data?.error || 'โหวตไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err) {
      console.error('Vote failed:', err);
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, votes: Math.max((c.votes || 1) - 1, 0) } : c))
      );
      setVotedIds((prev) => {
        const next = { ...prev };
        delete next[candidateId];
        return next;
      });
      showVoteError('โหวตไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setVotingId(null);
    }
  }

  /* ── Candidates always sorted by votes descending ── */
  const sortedCandidates = useMemo<Candidate[]>(() => {
    return [...candidates].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  }, [candidates]);

  /* ── Derived display data ── */
  const isSearchActive = query.trim().length > 0;

  // Top 3 from sorted list
  const top1 = sortedCandidates[0];
  const top2 = sortedCandidates[1];
  const top3 = sortedCandidates[2];
  const maxVotes = top1?.votes || 1;

  // รายชื่อรุ่นทั้งหมดที่มีอยู่จริงในข้อมูล (เรียงตามเลขรุ่นมาก→น้อย) สำหรับแท็บตัวกรอง
  const availableGenerations = useMemo(() => {
    const labels = new Map<string, number>();
    for (const c of sortedCandidates) {
      if (c.generation_label && !labels.has(c.generation_label)) {
        labels.set(c.generation_label, c.generationNumber ?? 0);
      }
    }
    return Array.from(labels.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label]) => label);
  }, [sortedCandidates]);

  const isGenerationFilterActive = selectedGeneration !== 'all';

  // List candidates for table:
  // - ค้นหา: ค้นหาจากรายชื่อทั้งหมด (ไม่กรองรุ่นซ้อน เพื่อให้ค้นข้ามรุ่นได้เสมอ)
  // - กรองรุ่น: กรองตามรุ่นที่เลือก (ตัดโควตาอันดับ 4-10 ออก แสดงทุกคนในรุ่นนั้น)
  // - ปกติ: โชว์ถึงอันดับ 10 (อันดับ 4 ถึง 10)
  const remainingCandidates = useMemo(() => {
    if (isSearchActive) {
      const q = query.toLowerCase().trim();
      return sortedCandidates.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.studentId && c.studentId.includes(q)) ||
          c.company?.toLowerCase().includes(q) ||
          c.position?.toLowerCase().includes(q) ||
          c.generation_label?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q)
      );
    }
    if (isGenerationFilterActive) {
      return sortedCandidates.filter((c) => c.generation_label === selectedGeneration);
    }
    // ในตารางโชว์ถึงอันดับ 10 (index 3 ถึง 10 คืออันดับ 4 - 10)
    return sortedCandidates.slice(3, 10);
  }, [sortedCandidates, isSearchActive, query, isGenerationFilterActive, selectedGeneration]);

  const totalVotesCount = useMemo(() => {
    return sortedCandidates.reduce((sum, c) => sum + (c.votes || 0), 0);
  }, [sortedCandidates]);


  /* ═══════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════ */
  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto px-2 sm:px-4 py-2">

      {/* แจ้งเตือนตอนโหวตไม่สำเร็จ (เช่น ใช้สิทธิ์โควตาในรุ่น/นอกรุ่นไปแล้ว) */}
      {voteError && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 shadow-hero animate-fade-in max-w-[90vw]">
          <span>⚠️</span>
          <span>{voteError}</span>
        </div>
      )}

      {/* ╔══════════════════════════════════════════╗
          ║  1. HERO BANNER - SOFT PASTEL THEME      ║
          ╚══════════════════════════════════════════╝ */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-violet-100 via-pink-50 to-amber-100 border border-pink-200/60 p-6 sm:p-8 shadow-sm">
        {/* Soft pastel decorative glow circles */}
        <div className="absolute -top-12 -right-12 h-56 w-56 rounded-full bg-rose-200/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 left-1/4 h-48 w-48 rounded-full bg-violet-200/40 blur-2xl pointer-events-none" />
        <div className="absolute top-0 left-0 h-40 w-40 rounded-full bg-amber-200/30 blur-2xl pointer-events-none" />
        
        {/* Floating subtle star sparkles */}
        <div className="absolute top-5 right-8 text-pink-300 hidden sm:block animate-pulse">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="absolute bottom-5 left-1/3 text-amber-300/80 hidden sm:block">
          <Star className="h-4 w-4 fill-amber-200" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold bg-white/80 backdrop-blur-sm border border-violet-200/70 text-violet-700 shadow-2xs">
              <Crown className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
              <span>ทำเนียบเกียรติยศ • CS แม่โจ้</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight flex items-center gap-2 flex-wrap">
              <span>ศิษย์เก่าดีเด่น</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 font-extrabold">
                Hall of Fame
              </span>
              <span className="text-2xl">✨</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              ร่วมส่งกำลังใจและโหวตสนับสนุนศิษย์เก่าคนเก่ง ผู้สร้างแรงบันดาลใจและคุณประโยชน์แก่สังคม 💖
            </p>
          </div>

          {/* Stats Pills in Soft Pastel */}
          <div className="flex gap-2.5 shrink-0">
            <div className="flex flex-col items-center justify-center bg-white/85 backdrop-blur-md rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 border border-pink-200/70 shadow-2xs">
              <div className="flex items-center gap-1 text-violet-600 text-xs font-bold">
                <Users className="h-3.5 w-3.5 text-violet-500" />
                <span>ผู้ได้รับการเสนอชื่อ</span>
              </div>
              <span className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5">
                {mergedInitial.length} <span className="text-xs font-normal text-slate-400">ท่าน</span>
              </span>
            </div>

            <div className="flex flex-col items-center justify-center bg-white/85 backdrop-blur-md rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 border border-pink-200/70 shadow-2xs">
              <div className="flex items-center gap-1 text-rose-600 text-xs font-bold">
                <Heart className="h-3.5 w-3.5 fill-rose-400 text-rose-400" />
                <span>คะแนนโหวตรวม</span>
              </div>
              <span className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5">
                {totalVotesCount.toLocaleString()} <span className="text-xs font-normal text-slate-400">โหวต</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {!isVotingOpen ? (
        /* ╔══════════════════════════════════════════╗
            ║  ยังไม่เปิดโหวต — สถานะว่าง             ║
            ╚══════════════════════════════════════════╝ */
        <div className="bg-white rounded-[32px] border border-slate-100 p-12 sm:p-16 text-center shadow-xs">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 text-violet-500 mb-4">
            <CalendarClock className="h-8 w-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-800">ยังไม่เปิดโหวตในขณะนี้</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
            รอแอดมินประกาศเปิดโหวตศิษย์เก่าดีเด่นประจำปีนี้ก่อนนะครับ
            เมื่อเปิดโหวตแล้วรายชื่อผู้ได้รับการเสนอชื่อจะขึ้นแสดงที่หน้านี้ทันที
          </p>
        </div>
      ) : (
      <>
      {/* ╔══════════════════════════════════════════╗
          ║  popup วิธีการโหวต — โผล่ครั้งเดียวตอนเข้าหน้านี้  ║
          ╚══════════════════════════════════════════╝ */}
      {showHowToVote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={() => setShowHowToVote(false)}
        >
          <div
            className="relative w-full max-w-sm bg-white rounded-[32px] p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowHowToVote(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-1.5">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 mb-1">
                <HelpCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-slate-800">วิธีการโหวต 💖</h3>
            </div>

            <ul className="space-y-2.5 text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-xs font-bold mt-0.5">1</span>
                <span>ทุกคนมีสิทธิ์โหวต <b>2 ครั้ง</b> ต่อรอบ — โหวตให้ศิษย์เก่า<b>ในรุ่นตัวเอง</b>ได้ 1 ครั้ง และ<b>นอกรุ่น</b>อีก 1 ครั้ง</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-xs font-bold mt-0.5">2</span>
                <span>กดปุ่ม <b>โหวต 💖</b> ที่การ์ดของศิษย์เก่าที่ต้องการสนับสนุน โหวตแล้วแก้ไขไม่ได้</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-xs font-bold mt-0.5">3</span>
                <span>ทุกโหวตที่คุณส่งจะได้รับ <b>+10 แต้มสะสม</b> ทันที</span>
              </li>
            </ul>

            <button
              onClick={() => setShowHowToVote(false)}
              className="w-full rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 py-3 text-sm font-bold text-white shadow-md hover:opacity-95 transition-all cursor-pointer"
            >
              เข้าใจแล้ว เริ่มโหวตเลย ✨
            </button>
          </div>
        </div>
      )}

      {/* ╔══════════════════════════════════════════╗
          ║  2+4. TOP 3 (ซ้าย) วางข้างลิสต์อันดับ 4-10 (ขวา)  ║
          ╚══════════════════════════════════════════╝ */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_365px] gap-6 items-start">

      {/* ╔══════════════════════════════════════════╗
          ║  2. TOP 3 - FLOATING CIRCULAR AVATARS    ║
          ╚══════════════════════════════════════════╝ */}
      {top1 && top2 && top3 && (
        <section className="relative rounded-[36px] border border-violet-100 bg-gradient-to-b from-white via-violet-50/30 to-pink-50/20 p-8 sm:p-10 shadow-xs overflow-hidden">
          {/* Subtle background pastel glow aura */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-96 rounded-full bg-gradient-to-r from-amber-100/60 via-pink-100/50 to-violet-100/60 blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="relative z-10 text-center mb-6 space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/90 border border-amber-200/80 px-3 py-1 text-xs font-bold text-amber-700 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
              <span>TOP 3 LEADERBOARD</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-800 flex items-center justify-center gap-1.5">
              <span>ผู้นำคะแนนโหวต</span>
              <span>🏆</span>
            </h2>
          </div>

          {/* Floating Circular Top 3 Cards (2nd | 1st | 3rd) */}
          <div className="relative z-10 grid grid-cols-3 gap-6 sm:gap-7 items-end">
            
            {/* 🥈 Rank 2 (Left / Floating Pastel Sky-Lavender) */}
            <FloatingTopCard
              candidate={top2}
              rank={2}
              maxVotes={maxVotes}
              voted={votedIds[top2.id]}
              isVoting={votingId === top2.id}
              animating={voteAnimId === top2.id}
              onVote={(e) => handleVote(e, top2.id)}
              onSelect={() => setSelectedCandidate(top2)}
              theme="silver"
              className="order-1"
            />

            {/* 🥇 Rank 1 (Center / Floating Pastel Gold - Center Stage) */}
            <FloatingTopCard
              candidate={top1}
              rank={1}
              maxVotes={maxVotes}
              voted={votedIds[top1.id]}
              isVoting={votingId === top1.id}
              animating={voteAnimId === top1.id}
              onVote={(e) => handleVote(e, top1.id)}
              onSelect={() => setSelectedCandidate(top1)}
              theme="gold"
              isChampion
              className="order-2 -translate-y-2 z-10"
            />

            {/* 🥉 Rank 3 (Right / Floating Pastel Peach-Rose) */}
            <FloatingTopCard
              candidate={top3}
              rank={3}
              maxVotes={maxVotes}
              voted={votedIds[top3.id]}
              isVoting={votingId === top3.id}
              animating={voteAnimId === top3.id}
              onVote={(e) => handleVote(e, top3.id)}
              onSelect={() => setSelectedCandidate(top3)}
              theme="bronze"
              className="order-3"
            />
          </div>
        </section>
      )}

      <div className="space-y-6">

      {/* ╔══════════════════════════════════════════╗
          ║  3. SEARCH & FILTER TOOLBAR              ║
          ╚══════════════════════════════════════════╝ */}
      <section className="bg-white rounded-3xl border border-slate-200/70 shadow-xs p-4 sm:p-5 md:max-w-[365px] md:ml-auto xl:max-w-none xl:ml-0 xl:w-full">
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center gap-2 flex-wrap">
              <Award className="h-4 w-4 text-violet-500 shrink-0" />
              <span>รายชื่อศิษย์เก่าดีเด่น</span>
              {isSearchActive ? (
                <span className="shrink-0 text-xs font-bold text-pink-700 bg-pink-50 border border-pink-200/70 px-2.5 py-0.5 rounded-full">
                  ผลการค้นหา ({remainingCandidates.length})
                </span>
              ) : isGenerationFilterActive ? (
                <span className="shrink-0 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full">
                  {selectedGeneration} ({remainingCandidates.length} คน)
                </span>
              ) : (
                <span className="shrink-0 text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200/70 px-2.5 py-0.5 rounded-full">
                  อันดับ 4 - 10
                </span>
              )}
            </h3>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหาชื่อ หรือ รหัสนักศึกษา..."
                id="hof-search-input"
                className="w-full h-10 rounded-2xl border border-slate-200 bg-slate-50/70 pl-9 pr-8 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all"
              />
              {isSearchLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-violet-500 animate-spin" />
              )}
              {query && !isSearchLoading && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
              <button
                onClick={() => setViewMode('table')}
                title="มุมมองตาราง/รายการ"
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-violet-700 shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <LayoutList className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                title="มุมมองการ์ด"
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-violet-700 shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Generation Filter Dropdown — แสดงข้อมูลศิษย์เก่าแยกตามรุ่น */}
          {availableGenerations.length > 0 && (
            <div className="relative pt-1 border-t border-slate-100" ref={genDropdownRef}>
              <button
                onClick={() => setIsGenDropdownOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  isGenerationFilterActive
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" />
                  รุ่น: {selectedGeneration === 'all' ? 'ทุกรุ่น' : selectedGeneration}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isGenDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isGenDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-20 rounded-2xl border border-slate-200 bg-white shadow-md py-1.5 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedGeneration('all');
                      setIsGenDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
                      selectedGeneration === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ทุกรุ่น
                  </button>
                  {availableGenerations.map((gen) => (
                    <button
                      key={gen}
                      onClick={() => {
                        setSelectedGeneration(gen);
                        setIsGenDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
                        selectedGeneration === gen
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {gen}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ╔══════════════════════════════════════════╗
          ║  4. LEADERBOARD TABLE / LIST (RANK 4+)   ║
          ╚══════════════════════════════════════════╝ */}
      {remainingCandidates.length === 0 && !isSearchLoading ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-xs md:max-w-[365px] md:ml-auto xl:max-w-none xl:ml-0 xl:w-full">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 mb-3">
            <Trophy className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {isSearchActive
              ? 'ไม่พบรายชื่อที่ตรงกับการค้นหา'
              : isGenerationFilterActive
              ? `ยังไม่มีผู้ได้รับการเสนอชื่อจาก ${selectedGeneration}`
              : 'ไม่พบรายชื่อ'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {isSearchActive
              ? `ไม่พบข้อมูลจากคำค้นหา "${query}" ลองค้นหาด้วยชื่ออื่น`
              : isGenerationFilterActive
              ? 'ลองเลือกดูรุ่นอื่น หรือกลับไปดูทุกรุ่น'
              : `ยังไม่มีข้อมูลเพิ่มเติมในหมวดหมู่นี้`}
          </p>
          <button
            onClick={() => {
              setQuery('');
              setSelectedGeneration('all');
            }}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-full hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            แสดงทั้งหมด
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* ── TABLE / ROW LIST VIEW (Minimal & Clean) ── */
        <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-xs overflow-hidden md:max-w-[365px] md:ml-auto xl:max-w-none xl:ml-0 xl:w-full">
          {/* Desktop Table Header */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-2.5 bg-slate-50/90 border-b border-slate-200/70 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            <div className="w-8 shrink-0 text-center whitespace-nowrap">อันดับ</div>
            <div className="w-[185px] shrink-0 min-w-0">ศิษย์เก่า</div>
            <div className="w-[80px] shrink-0 text-right pr-1 whitespace-nowrap">คะแนนโหวต</div>
          </div>

          {/* List Rows */}
          <div className="divide-y divide-slate-100">
            {remainingCandidates.map((c, index) => {
              const rankInFull = sortedCandidates.findIndex((x) => x.id === c.id) + 1;
              const displayRank = rankInFull > 0 ? rankInFull : index + 1;

              const voted = votedIds[c.id];
              const isVoting = votingId === c.id;
              const animating = voteAnimId === c.id;

              return (
                <div
                  key={c.id}
                  id={`hof-row-${c.id}`}
                  onClick={() => setSelectedCandidate(c)}
                  className="group p-3 sm:px-3.5 sm:py-2.5 transition-colors duration-150 hover:bg-violet-50/40 cursor-pointer flex flex-col md:flex-row gap-2.5 md:gap-2 md:items-center"
                >
                  {/* Rank (Mobile & Desktop) */}
                  <div className="flex items-center justify-between md:justify-center md:w-8 md:shrink-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center justify-center font-black rounded-lg text-xs ${
                          displayRank <= 3
                            ? 'h-7 w-7 bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs'
                            : 'h-6 w-6 sm:h-7 sm:w-7 bg-slate-100 text-slate-600 border border-slate-200/80'
                        }`}
                      >
                        {displayRank}
                      </span>
                      {displayRank === 4 && (
                        <span className="md:hidden inline-flex items-center gap-1 text-[11px] font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200/70">
                          <Flame className="h-3 w-3 fill-pink-500 text-pink-500" />
                          กำลังมาแรง
                        </span>
                      )}
                    </div>

                    {/* Mobile Vote button (Top Right on Mobile) */}
                    <div className="md:hidden">
                      <VoteButton
                        voted={voted}
                        isVoting={isVoting}
                        animating={animating}
                        onVote={(e) => handleVote(e, c.id)}
                      />
                    </div>
                  </div>

                  {/* Alumni Info with Circular Avatar */}
                  <div className="flex items-center gap-2.5 min-w-0 md:w-[185px] md:shrink-0">
                    <div className="relative shrink-0">
                      <img
                        src={c.avatar_url}
                        alt={c.name}
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover ring-2 ring-violet-100 group-hover:ring-violet-300 transition-all shadow-2xs"
                      />
                      {voted && (
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs">
                          <CheckCircle2 className="h-3 w-3" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-slate-800 text-sm leading-snug group-hover:text-violet-700 transition-colors truncate">
                          {c.name}
                        </h4>
                        <span className="shrink-0 text-[10px] font-bold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md border border-violet-200/70">
                          {c.generation_label}
                        </span>
                      </div>

                      {c.studentId && (
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                          รหัส: {c.studentId}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Vote Count & Action (Desktop & Mobile) */}
                  <div className="flex items-center justify-between gap-2 self-start md:self-auto md:w-[80px] md:shrink-0">
                    {/* Vote Count */}
                    <div className="text-left md:text-right">
                      <span className="text-[11px] text-slate-400 font-medium md:hidden">คะแนน</span>
                      <span className="text-sm font-black text-slate-800 whitespace-nowrap">
                        {c.votes || 0} <span className="text-[10px] font-normal text-slate-400">โหวต</span>
                      </span>
                    </div>

                    {/* Desktop Vote Button */}
                    <div className="hidden md:block shrink-0">
                      <VoteButton
                        iconOnly
                        voted={voted}
                        isVoting={isVoting}
                        animating={animating}
                        onVote={(e) => handleVote(e, c.id)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── CARD GRID VIEW (Optional switch) ── */
        <div className="grid gap-4 sm:grid-cols-2 md:max-w-[460px] md:ml-auto">
          {remainingCandidates.map((c, index) => {
            const rankInFull = sortedCandidates.findIndex((x) => x.id === c.id) + 1;
            const displayRank = rankInFull > 0 ? rankInFull : index + 1;

            const voted = votedIds[c.id];
            const isVoting = votingId === c.id;
            const animating = voteAnimId === c.id;

            return (
              <div
                key={c.id}
                onClick={() => setSelectedCandidate(c)}
                className="group flex flex-col justify-between rounded-3xl border border-slate-200/70 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-violet-300 cursor-pointer"
              >
                <div>
                  <div className="relative mb-3.5 overflow-hidden rounded-2xl bg-slate-100 aspect-[4/3]">
                    <img
                      src={c.avatar_url}
                      alt={c.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2.5 left-2.5 flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900/80 backdrop-blur-sm text-white font-black text-xs shadow-2xs">
                      #{displayRank}
                    </div>
                    <div className="absolute top-2.5 right-2.5">
                      <span className="rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-0.5 text-xs font-bold text-slate-700 shadow-2xs">
                        {c.generation_label}
                      </span>
                    </div>
                  </div>

                  <h4 className="font-extrabold text-slate-800 text-sm sm:text-base leading-snug group-hover:text-violet-700 transition-colors">
                    {c.name}
                  </h4>
                  {c.studentId && (
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      รหัสนักศึกษา: {c.studentId}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium">คะแนนโหวต</span>
                    <p className="text-sm font-black text-slate-800">{c.votes || 0}</p>
                  </div>
                  <VoteButton
                    voted={voted}
                    isVoting={isVoting}
                    animating={animating}
                    onVote={(e) => handleVote(e, c.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      </div>
      </div>

      {/* ╔══════════════════════════════════════════╗
          ║  5. CANDIDATE PROFILE MODAL (YEARBOOK)   ║
          ╚══════════════════════════════════════════╝ */}
      {selectedCandidate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={() => setSelectedCandidate(null)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-[36px] p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedCandidate(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer z-10"
            >
              <X className="h-4 w-4" />
            </button>

            {/* ── Profile Header (Photo square-rounded, Gen badge, Name, studentId) ── */}
            <div className="text-center space-y-3">
              <div className="relative inline-block">
                <img
                  src={selectedCandidate.avatar_url}
                  alt={selectedCandidate.name}
                  className="h-32 w-32 rounded-3xl object-cover mx-auto ring-4 ring-indigo-100 shadow-md"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-center gap-1.5 mb-1.5">
                  {selectedCandidate.generation_label && (
                    <span className="inline-block bg-indigo-50 text-indigo-700 px-3 py-0.5 text-xs font-extrabold rounded-full border border-indigo-100">
                      {selectedCandidate.generation_label}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedCandidate.name}
                </h2>
                {selectedCandidate.studentId && (
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    รหัส: {selectedCandidate.studentId}
                  </p>
                )}
              </div>
            </div>

            {/* ── Info rows (position, company, careerType) ── */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-3 text-left">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 mt-0.5">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">ตำแหน่งงาน</p>
                  <p className="text-sm font-bold text-slate-800 break-words">
                    {selectedCandidate.position || 'ไม่ได้ระบุ'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 mt-0.5">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">สถานที่ทำงาน / องค์กร</p>
                  <p className="text-sm font-bold text-slate-800 break-words">
                    {selectedCandidate.company || 'ไม่ได้ระบุ'}
                  </p>
                </div>
              </div>

              {selectedCandidate.employmentType && (
                <div className="flex items-start gap-3 pt-2 border-t border-slate-200/60">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 mt-0.5">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">ประเภทสายงาน</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {selectedCandidate.employmentType}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Achievement / Description (like Senior Quote) ── */}
            {selectedCandidate.description && (
              <div className="rounded-2xl bg-violet-50/80 p-4 border border-violet-200/60 text-left shadow-2xs relative">
                <p className="text-xs font-bold text-violet-700 flex items-center gap-1.5 mb-2">
                  <Award className="h-3.5 w-3.5" />
                  ผลงานและคุณประโยชน์
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {selectedCandidate.description}
                </p>
              </div>
            )}

            {/* ── Vote Footer ── */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="text-left">
                <span className="text-[11px] text-slate-400 font-medium">คะแนนโหวตปัจจุบัน</span>
                <p className="text-lg font-black text-violet-600">
                  {selectedCandidate.votes || 0} <span className="text-xs font-normal text-slate-400">คะแนน</span>
                </p>
              </div>

              <VoteButton
                size="lg"
                voted={votedIds[selectedCandidate.id]}
                isVoting={votingId === selectedCandidate.id}
                animating={voteAnimId === selectedCandidate.id}
                onVote={(e) => handleVote(e, selectedCandidate.id)}
              />
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SUB-COMPONENT: VoteButton
═══════════════════════════════════════════════ */
function VoteButton({
  voted,
  isVoting,
  animating,
  onVote,
  size = 'sm',
  iconOnly = false,
}: {
  voted?: boolean;
  isVoting?: boolean;
  animating?: boolean;
  onVote: (e: React.MouseEvent) => void;
  size?: 'sm' | 'lg';
  iconOnly?: boolean;
}) {
  const iconSize = size === 'lg' ? 'h-4.5 w-4.5' : 'h-3.5 w-3.5';
  return (
    <button
      onClick={onVote}
      disabled={voted || isVoting}
      style={{
        transform: animating ? 'scale(0.85)' : 'scale(1)',
        transition: 'transform 0.15s ease',
      }}
      className={`inline-flex items-center justify-center font-bold rounded-full transition-all duration-200 shadow-2xs cursor-pointer disabled:cursor-default shrink-0
        ${iconOnly ? (size === 'lg' ? 'h-10 w-10' : 'h-8 w-8') : size === 'lg' ? 'gap-1.5 px-5 py-2 text-xs sm:text-sm' : 'gap-1.5 px-3.5 py-1.5 text-xs'}
        ${
          voted
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
            : 'bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white hover:opacity-95 hover:shadow-md hover:shadow-pink-500/20 active:scale-95'
        }`}
    >
      {isVoting ? (
        <Loader2 className={`animate-spin ${iconSize}`} />
      ) : voted ? (
        <>
          <CheckCircle2 className={`${iconSize} ${iconOnly ? '' : 'text-emerald-600'}`} />
          {!iconOnly && <span>โหวตแล้ว ✨</span>}
        </>
      ) : (
        <>
          <Heart className={`${iconSize} fill-white text-white`} />
          {!iconOnly && <span>โหวต 💖</span>}
        </>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════════
   SUB-COMPONENT: FloatingTopCard (Circular Floating Avatar)
═══════════════════════════════════════════════ */
interface FloatingTopCardProps {
  candidate: Candidate;
  rank: 1 | 2 | 3;
  maxVotes: number;
  voted: boolean;
  isVoting: boolean;
  animating: boolean;
  onVote: (e: React.MouseEvent) => void;
  onSelect: () => void;
  theme: 'gold' | 'silver' | 'bronze';
  isChampion?: boolean;
  className?: string;
}

function FloatingTopCard({
  candidate,
  rank,
  maxVotes,
  voted,
  isVoting,
  animating,
  onVote,
  onSelect,
  theme,
  isChampion = false,
  className = '',
}: FloatingTopCardProps) {
  const THEME_CONFIG = {
    gold: {
      avatarSize: 'w-[68%] sm:w-[60%] aspect-square',
      glowBg: 'bg-amber-300/40',
      ringColor: 'ring-2 ring-amber-300 ring-offset-2 ring-offset-amber-50/60',
      cardBg: 'bg-white/95 hover:bg-white',
      cardBorder: 'border-amber-200/90 shadow-md shadow-amber-200/40',
      badgeBg: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-amber-950',
      genBadge: 'bg-amber-50 text-amber-800 border-amber-200',
      voteCountColor: 'text-amber-600',
      voteBar: 'from-amber-400 to-yellow-400',
      medalIcon: '🥇',
      rankTitle: 'อันดับ 1',
    },
    silver: {
      avatarSize: 'w-[58%] sm:w-[50%] aspect-square',
      glowBg: 'bg-sky-200/40',
      ringColor: 'ring-2 ring-sky-300 ring-offset-2 ring-offset-sky-50/60',
      cardBg: 'bg-white/90 hover:bg-white',
      cardBorder: 'border-sky-200/80 shadow-xs shadow-sky-100',
      badgeBg: 'bg-gradient-to-r from-sky-300 via-blue-200 to-sky-300 text-sky-950',
      genBadge: 'bg-sky-50 text-sky-800 border-sky-200',
      voteCountColor: 'text-sky-700',
      voteBar: 'from-sky-400 to-blue-400',
      medalIcon: '🥈',
      rankTitle: 'อันดับ 2',
    },
    bronze: {
      avatarSize: 'w-[58%] sm:w-[50%] aspect-square',
      glowBg: 'bg-rose-200/40',
      ringColor: 'ring-2 ring-rose-300 ring-offset-2 ring-offset-rose-50/60',
      cardBg: 'bg-white/90 hover:bg-white',
      cardBorder: 'border-rose-200/80 shadow-xs shadow-rose-100',
      badgeBg: 'bg-gradient-to-r from-rose-300 via-pink-200 to-rose-300 text-rose-950',
      genBadge: 'bg-rose-50 text-rose-800 border-rose-200',
      voteCountColor: 'text-rose-700',
      voteBar: 'from-rose-400 to-pink-400',
      medalIcon: '🥉',
      rankTitle: 'อันดับ 3',
    },
  }[theme];

  const votePercent = Math.min(100, Math.round(((candidate.votes || 0) / maxVotes) * 100));

  return (
    <div className={`flex flex-col items-center group ${className}`}>
      {/* ─── 1. FLOATING CIRCULAR AVATAR WITH GLOW & BADGE ─── */}
      <div className="relative mb-2.5 flex w-full flex-col items-center">
        {/* Floating Crown above Avatar for Rank 1 */}
        {isChampion && (
          <div className="mb-1 -mt-2.5 flex items-center gap-1 animate-bounce duration-1000">
            <Crown className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 fill-amber-400 text-amber-500" />
          </div>
        )}

        {/* Circular Avatar Container — ขนาดเป็น % ของความกว้างการ์ด ปรับตามพื้นที่จริงเสมอ (กันแตกที่จอแคบ/การ์ดแคบ) */}
        <div
          onClick={onSelect}
          className={`relative cursor-pointer transition-transform duration-300 group-hover:-translate-y-1 ${THEME_CONFIG.avatarSize}`}
        >
          {/* Floating Halo Glow Circle */}
          <div
            className={`absolute -inset-2 rounded-full ${THEME_CONFIG.glowBg} blur-lg group-hover:scale-110 transition-transform duration-300 pointer-events-none`}
          />

          <img
            src={candidate.avatar_url}
            alt={candidate.name}
            className={`relative h-full w-full rounded-full object-cover shadow-lg ${THEME_CONFIG.ringColor} transition-transform duration-300 group-hover:scale-105`}
          />

          {/* Floating Circular Medal Badge */}
          <div
            className={`absolute -bottom-1 -right-1 flex h-[28%] w-[28%] min-h-6 min-w-6 max-h-11 max-w-11 items-center justify-center rounded-full ${THEME_CONFIG.badgeBg} border-2 border-white font-black text-xs sm:text-lg shadow-md`}
          >
            {THEME_CONFIG.medalIcon}
          </div>
        </div>
      </div>

      {/* ─── 2. SOFT PASTEL CARD CONTENT ─── */}
      <div
        onClick={onSelect}
        className={`w-full rounded-2xl border ${THEME_CONFIG.cardBg} ${THEME_CONFIG.cardBorder} px-3 py-3.5 sm:px-5 sm:py-5 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer backdrop-blur-xs`}
      >
        {/* Name */}
        <h3
          className={`font-black text-slate-800 leading-tight truncate group-hover:text-violet-700 transition-colors ${
            isChampion ? 'text-base sm:text-xl' : 'text-sm sm:text-lg'
          }`}
          title={candidate.name}
        >
          {candidate.name}
        </h3>

        <p className="text-xs sm:text-base text-slate-500 font-medium mt-0.5 truncate" title={candidate.position}>
          {candidate.position}
        </p>

        {/* Progress Bar */}
        <div className="mt-2.5 sm:mt-4">
          <div className="h-2 sm:h-3.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${THEME_CONFIG.voteBar} transition-all duration-700`}
              style={{ width: `${votePercent}%` }}
            />
          </div>
        </div>

        {/* Vote Footer */}
        <div className="mt-2.5 sm:mt-4 flex items-center justify-between gap-1">
          <p className={`font-black whitespace-nowrap ${isChampion ? 'text-lg sm:text-3xl' : 'text-base sm:text-2xl'} ${THEME_CONFIG.voteCountColor}`}>
            {candidate.votes || 0} <span className="text-[0.55em] font-medium text-slate-400">โหวต</span>
          </p>

          <VoteButton
            size={isChampion ? 'lg' : 'sm'}
            iconOnly
            voted={voted}
            isVoting={isVoting}
            animating={animating}
            onVote={onVote}
          />
        </div>
      </div>
    </div>
  );
}