'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Crown,
  Search,
  Zap,
  Heart,
  Flame,
  CheckCircle2,
  Sparkles,
  Award,
  Users,
  Star,
  Activity,
  Vote,
} from 'lucide-react';

interface Candidate {
  id: number;
  name: string;
  company: string;
  position: string;
  avatar_url: string;
  description: string;
  generation_label: string;
  votes: number;
}

interface HallOfFameGridProps {
  initialCandidates: Candidate[];
}

const DEFAULT_CANDIDATES: Candidate[] = [
  {
    id: 101,
    name: 'ดร.สมชาย วงศ์สุวรรณ',
    company: 'Tech Thailand Group',
    position: 'Chief Technology Officer (CTO)',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    description: 'ผู้พัฒนาโซลูชัน AI ทางการแพทย์ และศิษย์เก่าผู้สร้างคุณประโยชน์ให้สถาบัน',
    generation_label: 'รุ่น 35',
    votes: 184,
  },
  {
    id: 102,
    name: 'ณิชาภัทร อัศวไพศาล',
    company: 'Innovate Soft',
    position: 'Senior Lead Software Engineer',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop&q=80',
    description: 'ผู้ก่อตั้งสตาร์ทอัพเทคโนโลยีศิษย์เก่าและวิทยากรพิเศษบรรยายให้นักศึกษา',
    generation_label: 'รุ่น 38',
    votes: 156,
  },
  {
    id: 103,
    name: 'กิตติศักดิ์ รัตนกาญจน์',
    company: 'CyberGuard Corp',
    position: 'Head of Cybersecurity',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    description: 'ผู้เชี่ยวชาญด้านความปลอดภัยไซเบอร์ระดับประเทศ และที่ปรึกษาองค์กร',
    generation_label: 'รุ่น 40',
    votes: 128,
  },
  {
    id: 104,
    name: 'แพรวา สุวรรณรัตน์',
    company: 'DataMetrics Ltd.',
    position: 'Principal Data Scientist',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    description: 'ผู้บุกเบิกการวิเคราะห์ข้อมูล Big Data เพื่อสังคม',
    generation_label: 'รุ่น 41',
    votes: 95,
  },
  {
    id: 105,
    name: 'ธนากร เมธากุล',
    company: 'CloudWorks TH',
    position: 'DevOps & Infrastructure Lead',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    description: 'ผู้จัดการระบบคลาวด์ขนาดใหญ่และสนับสนุนทุนการศึกษาศิษย์เก่า',
    generation_label: 'รุ่น 42',
    votes: 72,
  },
  {
    id: 106,
    name: 'ศิรินทิพย์ จิระประเสริฐ',
    company: 'UX Design Studio',
    position: 'Head of Product Design',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    description: 'ผู้ออกแบบแอปพลิเคชันที่มีผู้ใช้งานกว่า 1 ล้านคนทั่วประเทศ',
    generation_label: 'รุ่น 43',
    votes: 48,
  },
];

export function HallOfFameGrid({ initialCandidates = [] }: HallOfFameGridProps) {
  const mergedInitial =
    initialCandidates.length >= 3
      ? initialCandidates.map((c, i) => ({
          ...c,
          votes: c.votes && c.votes > 0 ? c.votes : 184 - i * 28,
        }))
      : DEFAULT_CANDIDATES;

  const [candidates, setCandidates] = useState<Candidate[]>(mergedInitial);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [votedIds, setVotedIds] = useState<Record<number, boolean>>({});

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (query.trim() === '') {
        setCandidates(mergedInitial);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/hof/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setCandidates(data.results);
        } else {
          const q = query.toLowerCase();
          const filtered = mergedInitial.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              c.company?.toLowerCase().includes(q) ||
              c.position?.toLowerCase().includes(q) ||
              c.generation_label?.toLowerCase().includes(q)
          );
          setCandidates(filtered);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Sort strictly by votes descending
  const sortedCandidates = [...candidates].sort((a, b) => b.votes - a.votes);
  const totalVotesCast = sortedCandidates.reduce((acc, c) => acc + c.votes, 0);

  const firstPlace = sortedCandidates[0] || DEFAULT_CANDIDATES[0];
  const secondPlace = sortedCandidates[1] || DEFAULT_CANDIDATES[1];
  const thirdPlace = sortedCandidates[2] || DEFAULT_CANDIDATES[2];
  const remainingCandidates = sortedCandidates.slice(3);

  // Vote Action
  function handleVote(id: number) {
    if (votedIds[id]) return;
    setVotedIds((prev) => ({ ...prev, [id]: true }));
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, votes: c.votes + 1 } : c))
    );
  }

  // Calculate percentages
  const firstPct = totalVotesCast > 0 ? ((firstPlace.votes / totalVotesCast) * 100).toFixed(1) : '0';
  const secondPct = totalVotesCast > 0 ? ((secondPlace.votes / totalVotesCast) * 100).toFixed(1) : '0';
  const thirdPct = totalVotesCast > 0 ? ((thirdPlace.votes / totalVotesCast) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-8 pb-10 font-sans selection:bg-indigo-500 selection:text-white">
      {/* ===== TITLE BANNER ===== */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-card">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl gradient-primary text-white shadow-blue-glow">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-bold text-primary">
                GLOBAL ALUMNI AWARDS 2026
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight mt-0.5">
              หอเกียรติยศ & อันดับคะแนนโหวตศิษย์เก่าดีเด่น 🏆
            </h1>
          </div>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อผู้ได้รับผลโหวต..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* ===== 1. CENTERPIECE: TOP 3 CURVED RADIAL THEATRE STAGE (เด่นสง่าตรงกลางจอ) ===== */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-card relative overflow-hidden flex flex-col items-center justify-center min-h-[480px]">
        
        {/* Spotlight Cone Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-[400px] bg-[conic-gradient(from_180deg_at_50%_0%,rgba(245,158,11,0.25)_0deg,transparent_60deg,transparent_300deg,rgba(245,158,11,0.25)_360deg)] pointer-events-none blur-md" />

        {/* Stage Title Tag */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1 text-xs font-extrabold text-amber-800 shadow-2xs">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>3 อันดับแรกที่มีคะแนนโหวตสูงสุด</span>
        </div>

        {/* Top 3 Semicircle Podium Layout */}
        <div className="w-full max-w-4xl flex items-end justify-center gap-3 sm:gap-8 pt-4">
          
          {/* 🥈 #2 RANKING (LEFT - CURVED STAGE) */}
          {secondPlace && (
            <div className="relative flex flex-col items-center z-10 w-1/3 max-w-[210px]">
              {/* Avatar Frame */}
              <div className="relative mb-2 flex flex-col items-center">
                <div className="relative h-28 sm:h-36 w-28 sm:w-36 overflow-hidden rounded-full border-4 border-indigo-200 shadow-hero bg-slate-100">
                  <img
                    src={secondPlace.avatar_url || 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500'}
                    alt={secondPlace.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              {/* Rank Badge #2 */}
              <div className="mt-1 flex items-center gap-1.5 rounded-full bg-indigo-100 border border-indigo-200 px-3 py-1 text-indigo-700 shadow-xs">
                <span className="font-black text-xs">🥈 #2</span>
                <span className="text-xs font-bold truncate max-w-[80px]">{secondPlace.generation_label}</span>
              </div>

              {/* Name & Vote Count */}
              <div className="mt-2 text-center w-full">
                <p className="text-3xl sm:text-4xl font-extrabold text-foreground leading-none tabular-nums tracking-tight">
                  {secondPlace.votes}
                </p>
                <p className="text-[11px] font-semibold text-indigo-600">คะแนนโหวต</p>
                <p className="text-xs font-bold text-slate-800 mt-1 truncate">{secondPlace.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{secondPlace.position}</p>

                {/* Vote Button */}
                <button
                  onClick={() => handleVote(secondPlace.id)}
                  disabled={votedIds[secondPlace.id]}
                  className={`mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                    votedIds[secondPlace.id]
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs active:scale-95'
                  }`}
                >
                  {votedIds[secondPlace.id] ? 'โหวตแล้ว ✨' : '🗳️ โหวตคะแนน'}
                </button>
              </div>

              {/* Curved Semicircle Podium Base */}
              <div className="mt-3 w-full h-24 sm:h-32 rounded-t-[50px] bg-gradient-to-b from-indigo-100 via-indigo-200/70 to-slate-200 border-t-4 border-indigo-300 shadow-hero flex flex-col items-center justify-start pt-3 text-indigo-900">
                <span className="text-2xl font-black">2</span>
                <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-700">รองอันดับ 1</span>
              </div>
            </div>
          )}

          {/* 👑 #1 RANKING (CENTER HERO - CURVED RADIAL CHAMPION STAGE) */}
          {firstPlace && (
            <div className="relative flex flex-col items-center z-20 w-1/3 max-w-[240px] -mt-6">
              {/* Crown Icon Above Avatar */}
              <Crown className="h-8 w-8 text-amber-500 drop-shadow-md animate-bounce mb-1" />

              {/* Avatar Frame */}
              <div className="relative mb-2 flex flex-col items-center">
                <div className="relative h-32 sm:h-44 w-32 sm:w-44 overflow-hidden rounded-full border-4 border-amber-400 shadow-blue-glow bg-amber-50">
                  <img
                    src={firstPlace.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500'}
                    alt={firstPlace.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              {/* Rank Badge #1 */}
              <div className="mt-1 flex items-center gap-1.5 rounded-full gradient-primary px-4 py-1 text-white shadow-md">
                <span className="font-black text-xs text-amber-300">👑 #1</span>
                <span className="text-xs font-extrabold truncate max-w-[90px]">{firstPlace.generation_label}</span>
              </div>

              {/* Name & Vote Count */}
              <div className="mt-2 text-center w-full">
                <p className="text-4xl sm:text-5xl font-black text-amber-600 leading-none tabular-nums tracking-tight">
                  {firstPlace.votes}
                </p>
                <p className="text-xs font-extrabold text-amber-700">คะแนนโหวตสูงสุด</p>
                <p className="text-sm font-extrabold text-foreground mt-1 truncate">{firstPlace.name}</p>
                <p className="text-xs font-semibold text-muted-foreground truncate">{firstPlace.position}</p>

                {/* Vote Button */}
                <button
                  onClick={() => handleVote(firstPlace.id)}
                  disabled={votedIds[firstPlace.id]}
                  className={`mt-2 inline-flex items-center gap-1 rounded-full px-3.5 py-1 text-xs font-bold transition-all ${
                    votedIds[firstPlace.id]
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'gradient-primary text-white shadow-md hover:opacity-90 active:scale-95'
                  }`}
                >
                  {votedIds[firstPlace.id] ? 'โหวตแล้ว ✨' : '🗳️ โหวตคะแนน'}
                </button>
              </div>

              {/* Curved Radial Theatre Champion Podium Base */}
              <div className="mt-3 w-full h-32 sm:h-44 rounded-t-[70px] bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 border-t-4 border-amber-200 shadow-hero flex flex-col items-center justify-start pt-4 text-amber-950">
                <span className="text-3xl font-black">1</span>
                <span className="text-xs font-black tracking-wider uppercase bg-white/40 px-3 py-0.5 rounded-full mt-1">ศิษย์เก่าดีเด่น</span>
              </div>
            </div>
          )}

          {/* 🥉 #3 RANKING (RIGHT - CURVED STAGE) */}
          {thirdPlace && (
            <div className="relative flex flex-col items-center z-10 w-1/3 max-w-[210px]">
              {/* Avatar Frame */}
              <div className="relative mb-2 flex flex-col items-center">
                <div className="relative h-28 sm:h-36 w-28 sm:w-36 overflow-hidden rounded-full border-4 border-rose-200 shadow-hero bg-rose-50">
                  <img
                    src={thirdPlace.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500'}
                    alt={thirdPlace.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              {/* Rank Badge #3 */}
              <div className="mt-1 flex items-center gap-1.5 rounded-full bg-rose-100 border border-rose-200 px-3 py-1 text-rose-700 shadow-xs">
                <span className="font-black text-xs">🥉 #3</span>
                <span className="text-xs font-bold truncate max-w-[80px]">{thirdPlace.generation_label}</span>
              </div>

              {/* Name & Vote Count */}
              <div className="mt-2 text-center w-full">
                <p className="text-3xl sm:text-4xl font-extrabold text-foreground leading-none tabular-nums tracking-tight">
                  {thirdPlace.votes}
                </p>
                <p className="text-[11px] font-semibold text-rose-600">คะแนนโหวต</p>
                <p className="text-xs font-bold text-slate-800 mt-1 truncate">{thirdPlace.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{thirdPlace.position}</p>

                {/* Vote Button */}
                <button
                  onClick={() => handleVote(thirdPlace.id)}
                  disabled={votedIds[thirdPlace.id]}
                  className={`mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                    votedIds[thirdPlace.id]
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-rose-600 text-white hover:bg-rose-700 shadow-xs active:scale-95'
                  }`}
                >
                  {votedIds[thirdPlace.id] ? 'โหวตแล้ว ✨' : '🗳️ โหวตคะแนน'}
                </button>
              </div>

              {/* Curved Semicircle Podium Base */}
              <div className="mt-3 w-full h-20 sm:h-28 rounded-t-[50px] bg-gradient-to-b from-rose-200 via-rose-300 to-amber-200 border-t-4 border-rose-300 shadow-hero flex flex-col items-center justify-start pt-3 text-rose-950">
                <span className="text-2xl font-black">3</span>
                <span className="text-[10px] font-bold tracking-wider uppercase text-rose-800">รองอันดับ 2</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== 2. LOWER PANEL: COMMUNITY VOTING STATS (ย้ายลงมาด้านล่างเต็มความกว้าง) ===== */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-card space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">สถิติคะแนนเสียง</span>
            <h2 className="text-base font-bold text-foreground mt-0.5">ภาพรวมสัดส่วนคะแนนโหวตประจำปี 2569</h2>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
            <Vote className="h-4 w-4" />
          </div>
        </div>

        {/* Real Vote Percentage Breakdown Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>สัดส่วนคะแนนโหวต Top 3</span>
            <span className="font-bold text-foreground">{totalVotesCast} เสียงโหวตทั้งหมด</span>
          </div>
          <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
            <div className="h-full bg-amber-400 rounded-l-full transition-all duration-500" style={{ width: `${firstPct}%` }} />
            <div className="h-full bg-indigo-500 transition-all duration-500 mx-0.5" style={{ width: `${secondPct}%` }} />
            <div className="h-full bg-rose-400 rounded-r-full transition-all duration-500" style={{ width: `${thirdPct}%` }} />
          </div>
          <div className="flex justify-between text-xs font-bold">
            <span className="text-amber-600">อันดับ 1 ({firstPct}%)</span>
            <span className="text-indigo-600">อันดับ 2 ({secondPct}%)</span>
            <span className="text-rose-600">อันดับ 3 ({thirdPct}%)</span>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-center">
          <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100">
            <p className="text-xs font-bold text-amber-700">คะแนนสูงสุด</p>
            <p className="mt-1 text-xl font-extrabold text-foreground tabular-nums">{firstPlace.votes}<span className="text-xs font-normal"> โหวต</span></p>
            <p className="text-[10px] text-muted-foreground mt-0.5">อันดับ 1</p>
          </div>
          <div className="bg-primary-light/50 p-3.5 rounded-2xl border border-primary/10">
            <p className="text-xs font-bold text-primary">ยอดโหวตรวม</p>
            <p className="mt-1 text-xl font-extrabold text-foreground tabular-nums">{totalVotesCast}<span className="text-xs font-normal"> เสียง</span></p>
            <p className="text-[10px] text-muted-foreground mt-0.5">จากสมาชิก</p>
          </div>
          <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100">
            <p className="text-xs font-bold text-emerald-600">ความโปร่งใส</p>
            <p className="mt-1 text-xl font-extrabold text-foreground tabular-nums">100<span className="text-xs font-normal">%</span></p>
            <p className="text-[10px] text-muted-foreground mt-0.5">โปร่งใส</p>
          </div>
        </div>
      </div>

      {/* ===== LIVE SUMMARY TICKER BANNER ===== */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-card flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 font-bold text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            รวมคะแนนโหวตสะสมจากสมาชิกทั้งหมด
          </span>
          <span className="text-xl sm:text-2xl font-black text-primary tabular-nums tracking-tight">
            {totalVotesCast} <span className="text-xs font-normal text-muted-foreground">เสียงโหวต</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span>จัดอันดับแบบเรียลไทม์จากเสียงโหวตของผู้ใช้งานจริง</span>
        </div>
      </div>

      {/* ===== LEADERBOARD TABLE (#4 AND BELOW) ===== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <span>ตารางสรุปผลคะแนนโหวตศิษย์เก่าทั้งหมด</span>
          </h3>
          <span className="text-xs text-muted-foreground">ทั้งหมด {candidates.length} รายการ</span>
        </div>

        {loading && <p className="text-center text-xs text-muted-foreground py-8">กำลังค้นหาข้อมูล...</p>}

        {!loading && candidates.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-muted-foreground shadow-card">
            <p className="text-sm">ไม่พบศิษย์เก่าตามเงื่อนไขที่ค้นหา</p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {(query ? sortedCandidates : remainingCandidates).map((c, index) => {
            const rankNumber = query ? index + 1 : index + 4;
            const isVoted = votedIds[c.id];

            return (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-card transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank Badge Number */}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-black text-xs text-slate-700">
                    #{rankNumber}
                  </span>

                  {/* Avatar */}
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                    <img
                      src={c.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                      alt={c.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-bold text-foreground truncate">{c.name}</p>
                      <span className="shrink-0 rounded-full bg-primary-light px-2 py-0.5 text-xs font-semibold text-primary">
                        {c.generation_label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.position} {c.company ? `· ${c.company}` : ''}
                    </p>
                    {c.description && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">{c.description}</p>
                    )}
                  </div>
                </div>

                {/* Real Votes & Vote Action */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-extrabold text-amber-700">
                    <Vote className="h-3 w-3 text-amber-500" />
                    {c.votes} คะแนนโหวต
                  </span>

                  <button
                    onClick={() => handleVote(c.id)}
                    disabled={isVoted}
                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                      isVoted
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-primary-light text-primary hover:bg-primary hover:text-white active:scale-95'
                    }`}
                  >
                    {isVoted ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" /> โหวตแล้ว ✨
                      </>
                    ) : (
                      <>
                        <Vote className="h-3 w-3" /> ลงคะแนนโหวต (+1)
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}