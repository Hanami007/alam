'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Trophy,
  Crown,
  Medal,
  Search,
  Heart,
  Briefcase,
  GraduationCap,
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
}

interface HallOfFameGridProps {
  initialCandidates: Candidate[];
}

/* ═══════════════════════════════════════════════
   MOCK / DEFAULT DATA
═══════════════════════════════════════════════ */
const DEFAULT_CANDIDATES: Candidate[] = [
  {
    id: 101,
    name: 'ดร.สมชาย วงศ์สุวรรณ',
    studentId: '58010101',
    company: 'Tech Thailand Group',
    position: 'Chief Technology Officer (CTO)',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80',
    description: 'ผู้พัฒนาโซลูชัน AI ทางการแพทย์ และศิษย์เก่าผู้สร้างคุณประโยชน์ให้สถาบัน',
    generation_label: 'รุ่น 35',
    generationNumber: 35,
    votes: 184,
  },
  {
    id: 102,
    name: 'ณิชาภัทร อัศวไพศาล',
    studentId: '61010045',
    company: 'Innovate Soft',
    position: 'Senior Lead Software Engineer',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop&q=80',
    description: 'ผู้ก่อตั้งสตาร์ทอัพเทคโนโลยีศิษย์เก่าและวิทยากรพิเศษบรรยายให้นักศึกษา',
    generation_label: 'รุ่น 38',
    generationNumber: 38,
    votes: 156,
  },
  {
    id: 103,
    name: 'กิตติศักดิ์ รัตนกาญจน์',
    studentId: '60010099',
    company: 'CyberGuard Corp',
    position: 'Head of Cybersecurity',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    description: 'ผู้เชี่ยวชาญด้านความปลอดภัยไซเบอร์ระดับประเทศ และที่ปรึกษาองค์กร',
    generation_label: 'รุ่น 40',
    generationNumber: 40,
    votes: 128,
  },
  {
    id: 104,
    name: 'แพรวา สุวรรณรัตน์',
    studentId: '62010030',
    company: 'DataMetrics Ltd.',
    position: 'Principal Data Scientist',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    description: 'ผู้บุกเบิกการวิเคราะห์ข้อมูล Big Data เพื่อสังคม',
    generation_label: 'รุ่น 41',
    generationNumber: 41,
    votes: 95,
  },
  {
    id: 105,
    name: 'ธนากร เมธากุล',
    studentId: '63010055',
    company: 'CloudWorks TH',
    position: 'DevOps & Infrastructure Lead',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    description: 'ผู้จัดการระบบคลาวด์ขนาดใหญ่และสนับสนุนทุนการศึกษาศิษย์เก่า',
    generation_label: 'รุ่น 42',
    generationNumber: 42,
    votes: 72,
  },
  {
    id: 106,
    name: 'ศิรินทิพย์ จิระประเสริฐ',
    studentId: '59010022',
    company: 'UX Design Studio',
    position: 'Head of Product Design',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    description: 'ผู้ออกแบบแอปพลิเคชันที่มีผู้ใช้งานกว่า 1 ล้านคนทั่วประเทศ',
    generation_label: 'รุ่น 43',
    generationNumber: 43,
    votes: 48,
  },
  {
    id: 107,
    name: 'วรพล ทองคำ',
    studentId: '57010088',
    company: 'Kasikorn Bank',
    position: 'VP, Digital Banking',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
    description: 'นักพัฒนาระบบธนาคารดิจิทัลชั้นนำของประเทศ',
    generation_label: 'รุ่น 33',
    generationNumber: 33,
    votes: 61,
  },
  {
    id: 108,
    name: 'ปิยะนุช แก้วมณี',
    studentId: '64010012',
    company: 'LINE MAN Wongnai',
    position: 'Senior Product Manager',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    description: 'ผู้บริหารผลิตภัณฑ์ดิจิทัลที่มียอดใช้งานหลักล้านคนต่อวัน',
    generation_label: 'รุ่น 44',
    generationNumber: 44,
    votes: 39,
  },
];

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export function HallOfFameGrid({ initialCandidates = [] }: HallOfFameGridProps) {
  /* ── Merged initial data, sorted by votes ── */
  const mergedInitial = useMemo<Candidate[]>(() => {
    const raw =
      initialCandidates && initialCandidates.length >= 3
        ? initialCandidates.map((c, i) => ({
            ...c,
            votes: c.votes && c.votes > 0 ? c.votes : Math.max(10, 184 - i * 28),
          }))
        : DEFAULT_CANDIDATES;
    return [...raw].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  }, [initialCandidates]);

  /* ── State ── */
  const [candidates, setCandidates] = useState<Candidate[]>(mergedInitial);
  const [query, setQuery] = useState('');
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [votedIds, setVotedIds] = useState<Record<number, boolean>>({});
  const [votingId, setVotingId] = useState<number | null>(null);
  const [selectedGen, setSelectedGen] = useState<number | null>(null);
  const [voteAnimId, setVoteAnimId] = useState<number | null>(null);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  /* ── Generation list derived from merged data ── */
  const generations = useMemo(() => {
    const genNums = [
      ...new Set(
        mergedInitial
          .map((c) => c.generationNumber)
          .filter((n): n is number => typeof n === 'number')
      ),
    ].sort((a, b) => a - b);
    return genNums;
  }, [mergedInitial]);

  /* ── Search effect with debounce ── */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (query.trim() === '') {
        setCandidates(mergedInitial);
        return;
      }
      setIsSearchLoading(true);
      try {
        const res = await fetch(`/api/hof/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setCandidates([...data.results].sort((a, b) => (b.votes || 0) - (a.votes || 0)));
        } else {
          // Client-side fallback: search by name OR studentId
          const q = query.toLowerCase().trim();
          const filtered = mergedInitial.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              (c.studentId && c.studentId.includes(q)) ||
              c.company?.toLowerCase().includes(q) ||
              c.position?.toLowerCase().includes(q) ||
              c.generation_label?.toLowerCase().includes(q) ||
              c.description?.toLowerCase().includes(q)
          );
          setCandidates(filtered);
        }
      } catch {
        // Fallback search on error
        const q = query.toLowerCase().trim();
        const filtered = mergedInitial.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.studentId && c.studentId.includes(q)) ||
            c.company?.toLowerCase().includes(q) ||
            c.position?.toLowerCase().includes(q) ||
            c.generation_label?.toLowerCase().includes(q)
        );
        setCandidates(filtered);
      } finally {
        setIsSearchLoading(false);
      }
    }, 280);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, mergedInitial]);

  /* ── Vote handler ── */
  async function handleVote(e: React.MouseEvent, candidateId: number) {
    e.stopPropagation();
    if (votedIds[candidateId] || votingId !== null) return;
    setVotingId(candidateId);
    setVoteAnimId(candidateId);
    setTimeout(() => setVoteAnimId(null), 600);

    // Optimistic update
    setCandidates((prev) =>
      prev
        .map((c) => (c.id === candidateId ? { ...c, votes: (c.votes || 0) + 1 } : c))
        .sort((a, b) => (b.votes || 0) - (a.votes || 0))
    );
    setVotedIds((prev) => ({ ...prev, [candidateId]: true }));

    try {
      await fetch('/api/hof/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId }),
      });
    } catch (err) {
      console.error('Vote failed:', err);
    } finally {
      setVotingId(null);
    }
  }

  /* ── Derived display data ── */
  const isSearchActive = query.trim().length > 0;

  // Top 3 from sorted full list (only when not searching)
  const top1 = mergedInitial[0];
  const top2 = mergedInitial[1];
  const top3 = mergedInitial[2];
  const maxVotes = top1?.votes || 1;

  // Grid cards: filtered by generation + search
  const gridCandidates = useMemo(() => {
    let list = isSearchActive ? candidates : mergedInitial;
    if (!isSearchActive && selectedGen !== null) {
      list = list.filter((c) => c.generationNumber === selectedGen);
    }
    if (!isSearchActive && selectedGen === null) {
      list = list.slice(3); // hide top 3 when showing all (they're in podium)
    }
    return list;
  }, [isSearchActive, candidates, mergedInitial, selectedGen]);

  const hasActiveFilter = isSearchActive || selectedGen !== null;

  /* ── Vote button renderer ── */
  const VoteButton = ({
    candidate,
    size = 'sm',
  }: {
    candidate: Candidate;
    size?: 'sm' | 'lg';
  }) => {
    const voted = votedIds[candidate.id];
    const isVoting = votingId === candidate.id;
    const animating = voteAnimId === candidate.id;

    return (
      <button
        onClick={(e) => handleVote(e, candidate.id)}
        disabled={voted || isVoting}
        style={{ transform: animating ? 'scale(0.88)' : 'scale(1)', transition: 'transform 0.15s ease' }}
        className={`inline-flex items-center gap-1.5 font-bold rounded-full transition-all duration-200 shadow-sm cursor-pointer disabled:cursor-default
          ${size === 'lg' ? 'px-5 py-2.5 text-sm' : 'px-3.5 py-1.5 text-xs'}
          ${
            voted
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white hover:opacity-90 active:scale-95'
          }`}
      >
        {isVoting ? (
          <Loader2 className={`animate-spin ${size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'}`} />
        ) : voted ? (
          <CheckCircle2 className={size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
        ) : (
          <Heart className={size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
        )}
        <span>{voted ? 'โหวตแล้ว' : 'โหวต'}</span>
      </button>
    );
  };

  /* ═══════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════ */
  return (
    <div className="space-y-8 max-w-7xl mx-auto px-2 sm:px-4 py-2">

      {/* ╔══════════════════════════════════════════╗
          ║  1. HERO BANNER                          ║
          ╚══════════════════════════════════════════╝ */}
      <div
        className="relative overflow-hidden rounded-3xl text-white shadow-xl"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #533483 100%)',
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute -top-12 -right-12 h-64 w-64 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }}
        />
        <div
          className="absolute -bottom-16 -left-8 h-56 w-56 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }}
        />
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />

        <div className="relative z-10 p-6 sm:p-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold border border-amber-400/30 bg-amber-500/15 text-amber-300 backdrop-blur-sm">
                <Crown className="h-3.5 w-3.5" />
                <span>ทำเนียบเกียรติยศ • CS MJU</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                ศิษย์เก่าดีเด่น{' '}
                <span
                  style={{
                    background: 'linear-gradient(90deg, #fbbf24, #f97316)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Hall of Fame
                </span>
              </h1>
              <p className="text-sm text-white/70 leading-relaxed">
                ร่วมเชิดชูเกียรติและโหวตสนับสนุนศิษย์เก่าผู้สร้างคุณประโยชน์อันโดดเด่นแก่สังคมและสถาบัน
              </p>
            </div>

            <div className="flex gap-3 shrink-0">
              <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/15">
                <span className="text-2xl font-black text-amber-300">{mergedInitial.length}</span>
                <span className="text-[11px] text-white/60 font-semibold mt-0.5">ผู้สมัคร</span>
              </div>
              <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/15">
                <span className="text-2xl font-black text-emerald-300">
                  {Object.values(candidates).reduce((sum, c) => sum + (c.votes || 0), 0).toLocaleString()}
                </span>
                <span className="text-[11px] text-white/60 font-semibold mt-0.5">คะแนนรวม</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ╔══════════════════════════════════════════╗
          ║  2. TOP 3 PODIUM                         ║
          ╚══════════════════════════════════════════╝ */}
      {!isSearchActive && top1 && top2 && top3 && (
        <section
          className="relative overflow-hidden rounded-3xl border shadow-xl p-6 sm:p-10"
          style={{
            background: 'linear-gradient(160deg, #fffbeb 0%, #ffffff 50%, #fff7ed 100%)',
            borderColor: 'rgba(251,191,36,0.3)',
          }}
        >
          {/* Subtle sparkle dots */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{ backgroundImage: 'radial-gradient(rgba(251,191,36,0.4) 1.2px, transparent 1.2px)', backgroundSize: '36px 36px' }}
          />

          {/* Section header */}
          <div className="relative z-10 mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1.5 text-xs font-bold text-white shadow-md mb-3">
              <Trophy className="h-4 w-4" />
              <span>อันดับสูงสุดจากคะแนนโหวต</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              ผู้นำตารางคะแนน Top 3 🏆
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              ผู้ได้รับการโหวตสูงสุดจากศิษย์เก่าและนักศึกษาทุกรุ่น
            </p>
          </div>

          {/* Podium: 2nd | 1st | 3rd */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-5 items-end max-w-4xl mx-auto">

            {/* ── Rank 2 (Silver / Left) ── */}
            <PodiumCard
              candidate={top2}
              rank={2}
              maxVotes={maxVotes}
              voted={votedIds[top2.id]}
              isVoting={votingId === top2.id}
              animating={voteAnimId === top2.id}
              onVote={(e) => handleVote(e, top2.id)}
              podiumHeight="h-14"
              podiumColors="from-slate-300 to-slate-200"
              podiumTextColor="text-slate-600"
              cardBorder="border-slate-200"
              cardRing=""
              badgeColors="from-slate-400 to-slate-300"
              avatarRing="ring-slate-200"
              genBg="bg-slate-100"
              genText="text-slate-600"
              voteCountColor="text-slate-700"
              voteButtonColors="from-slate-700 to-slate-900"
              className="order-2 md:order-1"
              imgSize="h-24 w-24"
            />

            {/* ── Rank 1 (Gold / Center) ── */}
            <PodiumCard
              candidate={top1}
              rank={1}
              maxVotes={maxVotes}
              voted={votedIds[top1.id]}
              isVoting={votingId === top1.id}
              animating={voteAnimId === top1.id}
              onVote={(e) => handleVote(e, top1.id)}
              podiumHeight="h-24"
              podiumColors="from-amber-400 to-amber-300"
              podiumTextColor="text-amber-900"
              cardBorder="border-amber-400"
              cardRing="ring-4 ring-amber-100"
              badgeColors="from-amber-500 to-yellow-400"
              avatarRing="ring-amber-400"
              genBg="bg-amber-100"
              genText="text-amber-800"
              voteCountColor="text-amber-600"
              voteButtonColors="from-amber-500 to-orange-500"
              className="order-1 md:order-2 md:-mt-8 z-10"
              imgSize="h-28 w-28"
              isChampion
            />

            {/* ── Rank 3 (Bronze / Right) ── */}
            <PodiumCard
              candidate={top3}
              rank={3}
              maxVotes={maxVotes}
              voted={votedIds[top3.id]}
              isVoting={votingId === top3.id}
              animating={voteAnimId === top3.id}
              onVote={(e) => handleVote(e, top3.id)}
              podiumHeight="h-10"
              podiumColors="from-orange-300 to-amber-200"
              podiumTextColor="text-orange-900"
              cardBorder="border-orange-200"
              cardRing=""
              badgeColors="from-amber-700 to-orange-400"
              avatarRing="ring-orange-200"
              genBg="bg-orange-100"
              genText="text-orange-700"
              voteCountColor="text-slate-700"
              voteButtonColors="from-orange-600 to-amber-700"
              className="order-3 md:order-3"
              imgSize="h-24 w-24"
            />
          </div>
        </section>
      )}

      {/* ╔══════════════════════════════════════════╗
          ║  3. SEARCH BAR                           ║
          ╚══════════════════════════════════════════╝ */}
      <section className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Label */}
          <div className="shrink-0">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              ค้นหาและโหวตศิษย์เก่าดีเด่น
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">ค้นหาจากชื่อหรือรหัสนักศึกษา แล้วร่วมโหวตสนับสนุน</p>
          </div>

          {/* Search input */}
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ชื่อ หรือ รหัสนักศึกษา เช่น 60010001..."
              id="hof-search-input"
              className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50/70 pl-10 pr-9 text-sm text-slate-800 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all shadow-xs"
            />
            {isSearchLoading && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500 animate-spin" />
            )}
            {query && !isSearchLoading && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Generation filter chips */}
        {!isSearchActive && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto scrollbar-hide pb-1">
            <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" />
              เลือกรุ่น:
            </span>

            {/* All generations chip */}
            <button
              onClick={() => setSelectedGen(null)}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                selectedGen === null
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ทุกรุ่น
            </button>

            {generations.map((genNum) => {
              const count = mergedInitial.filter((c) => c.generationNumber === genNum).length;
              return (
                <button
                  key={genNum}
                  onClick={() => setSelectedGen(genNum === selectedGen ? null : genNum)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedGen === genNum
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
                  }`}
                >
                  รุ่น {genNum}
                  {count > 0 && (
                    <span
                      className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-black ${
                        selectedGen === genNum ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}

            {hasActiveFilter && (
              <button
                onClick={() => { setSelectedGen(null); setQuery(''); }}
                className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                รีเซ็ต
              </button>
            )}

            <span className="ml-auto text-[11px] font-semibold text-slate-400 shrink-0 hidden sm:inline">
              แสดง {isSearchActive ? candidates.length : (selectedGen !== null ? gridCandidates.length : mergedInitial.length)} รายการ
            </span>
          </div>
        )}
      </section>

      {/* ╔══════════════════════════════════════════╗
          ║  4. GENERATION SECTION HEADER            ║
          ╚══════════════════════════════════════════╝ */}
      {!isSearchActive && selectedGen !== null && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                ศิษย์เก่าดีเด่น รุ่น {selectedGen}
              </h3>
              <p className="text-xs text-slate-500">{gridCandidates.length} รายชื่อ</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedGen(null)}
            className="text-xs text-indigo-600 font-bold hover:text-indigo-800 transition-colors cursor-pointer flex items-center gap-1"
          >
            ดูทุกรุ่น <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {isSearchActive && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                ผลการค้นหา "{query}"
              </h3>
              <p className="text-xs text-slate-500">พบ {candidates.length} รายชื่อ</p>
            </div>
          </div>
          <button
            onClick={() => setQuery('')}
            className="text-xs text-rose-500 font-bold hover:text-rose-700 transition-colors cursor-pointer flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" /> ล้างการค้นหา
          </button>
        </div>
      )}

      {/* ╔══════════════════════════════════════════╗
          ║  5. CARDS GRID                           ║
          ╚══════════════════════════════════════════╝ */}
      {gridCandidates.length === 0 && !isSearchLoading ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-14 text-center shadow-xs">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
            <Trophy className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="text-base font-bold text-slate-700">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {isSearchActive
              ? `ไม่พบศิษย์เก่าจากคำค้น "${query}" ลองค้นหาด้วยชื่อหรือรหัสนักศึกษา`
              : `รุ่น ${selectedGen} ยังไม่มีข้อมูลในระบบ`}
          </p>
          <button
            onClick={() => { setQuery(''); setSelectedGen(null); }}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-full hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            แสดงทั้งหมด
          </button>
        </div>
      ) : (
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {gridCandidates.map((c, index) => {
            const rankInFull = mergedInitial.findIndex((x) => x.id === c.id) + 1;
            const displayRank = isSearchActive ? index + 1 : selectedGen !== null ? index + 1 : rankInFull;
            const voted = votedIds[c.id];
            const isVoting = votingId === c.id;
            const animating = voteAnimId === c.id;

            return (
              <div
                key={c.id}
                id={`hof-card-${c.id}`}
                className="group flex flex-col justify-between rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-amber-200"
              >
                <div>
                  {/* Image + Rank + Generation badge */}
                  <div className="relative mb-4 overflow-hidden rounded-2xl bg-slate-100 aspect-[4/3]">
                    <img
                      src={c.avatar_url}
                      alt={c.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Rank badge */}
                    <div className="absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900/80 backdrop-blur-sm text-white font-black text-xs shadow-md">
                      #{displayRank}
                    </div>
                    {/* Generation badge */}
                    {c.generation_label && (
                      <div className="absolute top-3 right-3">
                        <span className="rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-0.5 text-xs font-bold text-slate-700 shadow-sm">
                          {c.generation_label}
                        </span>
                      </div>
                    )}
                    {/* Voted overlay */}
                    {voted && (
                      <div className="absolute inset-0 bg-emerald-600/10 flex items-end justify-end p-3">
                        <span className="rounded-full bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 flex items-center gap-1 shadow">
                          <CheckCircle2 className="h-3 w-3" /> โหวตแล้ว
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-amber-600 transition-colors">
                      {c.name}
                    </h4>
                    {c.studentId && (
                      <p className="text-[10px] font-mono text-slate-400">
                        รหัสนักศึกษา: {c.studentId}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.position}</span>
                    </div>
                    {c.company && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{c.company}</span>
                      </div>
                    )}
                    {c.description && (
                      <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                        {c.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Vote footer */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
                  {/* Vote bar */}
                  <div className="flex-1 mr-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-400 font-medium">คะแนนโหวต</span>
                      <span className="text-sm font-black text-slate-800">{c.votes || 0}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-700"
                        style={{ width: `${Math.round(((c.votes || 0) / maxVotes) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Vote button */}
                  <button
                    onClick={(e) => handleVote(e, c.id)}
                    disabled={voted || isVoting}
                    style={{ transform: animating ? 'scale(0.85)' : 'scale(1)', transition: 'transform 0.15s ease' }}
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer disabled:cursor-default
                      ${voted
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 active:scale-95'
                      }`}
                  >
                    {isVoting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : voted ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Heart className="h-3.5 w-3.5" />
                    )}
                    {voted ? 'โหวตแล้ว' : 'โหวต'}
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Show "rest" label when showing all (no filter, no search) */}
      {!isSearchActive && selectedGen === null && gridCandidates.length === 0 && mergedInitial.length >= 3 && (
        <p className="text-center text-xs text-slate-400 py-4">
          ✨ ศิษย์เก่าดีเด่นอันดับ 1–3 แสดงอยู่ในพื้นที่ Podium ด้านบน
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SUB-COMPONENT: PodiumCard
═══════════════════════════════════════════════ */
interface PodiumCardProps {
  candidate: Candidate;
  rank: 1 | 2 | 3;
  maxVotes: number;
  voted: boolean;
  isVoting: boolean;
  animating: boolean;
  onVote: (e: React.MouseEvent) => void;
  podiumHeight: string;
  podiumColors: string;
  podiumTextColor: string;
  cardBorder: string;
  cardRing: string;
  badgeColors: string;
  avatarRing: string;
  genBg: string;
  genText: string;
  voteCountColor: string;
  voteButtonColors: string;
  className?: string;
  imgSize: string;
  isChampion?: boolean;
}

function PodiumCard({
  candidate,
  rank,
  maxVotes,
  voted,
  isVoting,
  animating,
  onVote,
  podiumHeight,
  podiumColors,
  podiumTextColor,
  cardBorder,
  cardRing,
  badgeColors,
  avatarRing,
  genBg,
  genText,
  voteCountColor,
  voteButtonColors,
  className = '',
  imgSize,
  isChampion = false,
}: PodiumCardProps) {
  const RANK_EMOJI = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const RANK_LABEL = { 1: 'อันดับ 1', 2: 'อันดับ 2', 3: 'อันดับ 3' };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        className={`w-full rounded-[28px] border-2 bg-white/95 p-5 text-center shadow-lg transition-transform duration-200 hover:-translate-y-1 ${cardBorder} ${cardRing}`}
      >
        {/* Champion badge (only rank 1) */}
        {isChampion && (
          <div className="mb-2 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1 text-xs font-black text-white shadow-md">
              <Crown className="h-3.5 w-3.5" />
              อันดับ 1 ยอดนิยม
            </span>
          </div>
        )}

        {/* Avatar + Medal badge */}
        <div className="relative mx-auto mb-3 inline-block">
          <img
            src={candidate.avatar_url}
            alt={candidate.name}
            className={`${imgSize} rounded-2xl object-cover ring-4 shadow-md ${avatarRing}`}
          />
          <div
            className={`absolute -bottom-2.5 -right-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr ${badgeColors} font-black text-sm shadow-md border-2 border-white`}
          >
            {RANK_EMOJI[rank]}
          </div>
        </div>

        {/* Generation */}
        <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold mb-1.5 ${genBg} ${genText}`}>
          {candidate.generation_label}
        </span>

        {/* Name */}
        <h3 className={`font-extrabold text-slate-900 leading-tight truncate ${isChampion ? 'text-lg' : 'text-base'}`}>
          {candidate.name}
        </h3>
        {candidate.studentId && (
          <p className="text-[10px] font-mono text-slate-400 mt-0.5">รหัส {candidate.studentId}</p>
        )}
        <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-1">{candidate.position}</p>
        <p className="text-xs font-semibold text-indigo-600 truncate">{candidate.company}</p>

        {/* Description */}
        <p className="mt-2.5 text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/80 rounded-xl p-2 text-left">
          "{candidate.description}"
        </p>

        {/* Vote progress bar */}
        <div className="mt-3 space-y-1">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${voteButtonColors} transition-all duration-700`}
              style={{ width: `${Math.round(((candidate.votes || 0) / maxVotes) * 100)}%` }}
            />
          </div>
        </div>

        {/* Vote footer */}
        <div className={`mt-4 flex items-center justify-between border-t pt-3 ${isChampion ? 'border-amber-100' : 'border-slate-100'}`}>
          <div className="text-left">
            <span className="text-xs text-slate-400 font-medium">คะแนนโหวต</span>
            <p className={`${isChampion ? 'text-xl' : 'text-base'} font-black ${voteCountColor}`}>
              {candidate.votes || 0}
            </p>
          </div>

          <button
            onClick={onVote}
            disabled={voted || isVoting}
            style={{ transform: animating ? 'scale(0.85)' : 'scale(1)', transition: 'transform 0.15s ease' }}
            className={`inline-flex items-center gap-1.5 rounded-full font-bold transition-all shadow-sm cursor-pointer disabled:cursor-default
              ${isChampion ? 'px-5 py-2.5 text-xs font-black' : 'px-4 py-2 text-xs'}
              ${voted
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : `bg-gradient-to-r ${voteButtonColors} text-white hover:opacity-90 active:scale-95`
              }`}
          >
            {isVoting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : voted ? (
              <><CheckCircle2 className="h-3.5 w-3.5" /> โหวตแล้ว</>
            ) : (
              <><Heart className="h-3.5 w-3.5" /> {isChampion ? 'โหวตเกียรติยศ' : 'โหวต'}</>
            )}
          </button>
        </div>
      </div>

      {/* Podium base (desktop only) */}
      <div
        className={`hidden md:flex w-full ${podiumHeight} bg-gradient-to-t ${podiumColors} rounded-t-2xl items-center justify-center font-black ${podiumTextColor} shadow-inner text-sm`}
      >
        {RANK_EMOJI[rank]} {RANK_LABEL[rank]}
      </div>
    </div>
  );
}