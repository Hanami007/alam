'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Trophy,
  Crown,
  Medal,
  Award,
  Search,
  Sparkles,
  Heart,
  Briefcase,
  GraduationCap,
  Building2,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

export interface Candidate {
  id: number;
  name: string;
  company: string;
  position: string;
  avatar_url: string;
  description: string;
  generation_label: string;
  votes?: number;
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
  const mergedInitial = useMemo(() => {
    const raw =
      initialCandidates && initialCandidates.length >= 3
        ? initialCandidates.map((c, i) => ({
            ...c,
            votes: c.votes && c.votes > 0 ? c.votes : Math.max(10, 184 - i * 28),
          }))
        : DEFAULT_CANDIDATES;

    return [...raw].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  }, [initialCandidates]);

  const [candidates, setCandidates] = useState<Candidate[]>(mergedInitial);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [votedIds, setVotedIds] = useState<Record<number, boolean>>({});
  const [votingId, setVotingId] = useState<number | null>(null);

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
          const sorted = [...data.results].sort((a, b) => (b.votes || 0) - (a.votes || 0));
          setCandidates(sorted);
        } else {
          const q = query.toLowerCase();
          const filtered = mergedInitial.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              c.company?.toLowerCase().includes(q) ||
              c.position?.toLowerCase().includes(q) ||
              c.generation_label?.toLowerCase().includes(q) ||
              c.description?.toLowerCase().includes(q)
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
  }, [query, mergedInitial]);

  async function handleVote(candidateId: number) {
    if (votedIds[candidateId]) return;
    setVotingId(candidateId);

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

  // Split top 3 for podium when not filtering or when candidates >= 3
  const isSearchActive = query.trim().length > 0;
  const top1 = candidates[0];
  const top2 = candidates[1];
  const top3 = candidates[2];
  const restCandidates = isSearchActive ? candidates : candidates.slice(3);

  return (
    <div className="space-y-10">
      {/* ===== PODIUM TOP 3 SECTION (Only shown when not actively searching) ===== */}
      {!isSearchActive && top1 && top2 && top3 && (
        <section className="relative overflow-hidden rounded-[36px] border border-amber-200/80 bg-gradient-to-b from-amber-50/60 via-white to-orange-50/30 p-6 sm:p-10 shadow-card">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1.5 text-xs font-bold text-white shadow-sm">
              <Crown className="h-4 w-4" />
              <span>ทำเนียบเกียรติยศ ศิษย์เก่าดีเด่นประจำปี</span>
            </div>
            <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Alumni Hall of Fame Top 3 🏆
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              ผู้ได้รับการโหวตสูงสุดและสร้างคุณประโยชน์อันโดดเด่นแก่สังคมและสถาบัน
            </p>
          </div>

          {/* Podium layout: 2nd (Left), 1st (Center/Higher), 3rd (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-5xl mx-auto pt-6">
            {/* Rank 2 (Silver) */}
            <div className="order-2 md:order-1 flex flex-col items-center">
              <div className="w-full rounded-[28px] border-2 border-slate-200 bg-white/95 p-5 text-center shadow-lg transition-transform duration-200 hover:-translate-y-1">
                <div className="relative mx-auto mb-3 inline-block">
                  <img
                    src={top2.avatar_url}
                    alt={top2.name}
                    className="h-24 w-24 rounded-2xl object-cover ring-4 ring-slate-200 shadow-md"
                  />
                  <div className="absolute -bottom-2.5 -right-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-400 to-slate-200 text-white font-black text-sm shadow-md border-2 border-white">
                    🥈
                  </div>
                </div>

                <span className="inline-block rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-600 mb-1.5">
                  {top2.generation_label}
                </span>
                <h3 className="font-bold text-slate-900 text-base leading-tight truncate">{top2.name}</h3>
                <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-1">{top2.position}</p>
                <p className="text-xs text-indigo-600 font-semibold truncate">{top2.company}</p>

                <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 rounded-xl p-2">
                  &ldquo;{top2.description}&rdquo;
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="text-left">
                    <span className="text-xs text-slate-400 font-medium">คะแนนโหวต</span>
                    <p className="text-base font-black text-slate-700">{top2.votes || 0}</p>
                  </div>
                  <button
                    onClick={() => handleVote(top2.id)}
                    disabled={votedIds[top2.id]}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all shadow-sm ${
                      votedIds[top2.id]
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-gradient-to-r from-slate-700 to-slate-900 text-white hover:opacity-90 active:scale-95'
                    }`}
                  >
                    {votedIds[top2.id] ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" /> โหวตแล้ว
                      </>
                    ) : (
                      <>
                        <Heart className="h-3.5 w-3.5" /> โหวต
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Podium Base 2 */}
              <div className="hidden md:flex w-full h-16 bg-gradient-to-t from-slate-300 to-slate-200 rounded-t-2xl items-center justify-center font-black text-slate-600 text-lg shadow-inner">
                อันดับ 2
              </div>
            </div>

            {/* Rank 1 (Gold - Center & Elevated) */}
            <div className="order-1 md:order-2 flex flex-col items-center -mt-4 sm:-mt-8 z-10">
              <div className="w-full rounded-[32px] border-2 border-amber-400 bg-gradient-to-b from-amber-50/50 to-white p-6 text-center shadow-xl ring-4 ring-amber-100 transition-transform duration-200 hover:-translate-y-1">
                <div className="mb-2 flex justify-center">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-black text-white shadow-sm animate-pulse">
                    <Crown className="h-3.5 w-3.5" /> อันดับ 1 ยอดนิยม
                  </span>
                </div>

                <div className="relative mx-auto mb-3 inline-block">
                  <img
                    src={top1.avatar_url}
                    alt={top1.name}
                    className="h-28 w-28 rounded-2xl object-cover ring-4 ring-amber-400 shadow-xl"
                  />
                  <div className="absolute -bottom-3 -right-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-white font-black text-base shadow-lg border-2 border-white">
                    🥇
                  </div>
                </div>

                <span className="inline-block rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-800 mb-1.5">
                  {top1.generation_label}
                </span>
                <h3 className="font-extrabold text-slate-900 text-lg leading-tight truncate">{top1.name}</h3>
                <p className="text-xs font-semibold text-slate-600 mt-1 line-clamp-1">{top1.position}</p>
                <p className="text-xs text-amber-600 font-bold truncate">{top1.company}</p>

                <p className="mt-3 text-xs text-slate-700 line-clamp-2 leading-relaxed bg-amber-50/70 rounded-xl p-2.5 font-medium border border-amber-100">
                  &ldquo;{top1.description}&rdquo;
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-amber-100 pt-3">
                  <div className="text-left">
                    <span className="text-xs text-slate-400 font-medium">คะแนนโหวต</span>
                    <p className="text-xl font-black text-amber-600">{top1.votes || 0}</p>
                  </div>
                  <button
                    onClick={() => handleVote(top1.id)}
                    disabled={votedIds[top1.id]}
                    className={`flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-black transition-all shadow-md ${
                      votedIds[top1.id]
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white hover:opacity-90 active:scale-95'
                    }`}
                  >
                    {votedIds[top1.id] ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> โหวตแล้ว
                      </>
                    ) : (
                      <>
                        <Heart className="h-4 w-4" /> โหวตเกียรติยศ
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Podium Base 1 */}
              <div className="hidden md:flex w-full h-24 bg-gradient-to-t from-amber-400 to-amber-300 rounded-t-2xl items-center justify-center font-black text-amber-900 text-xl shadow-inner">
                🥇 ชนะเลิศอันดับ 1
              </div>
            </div>

            {/* Rank 3 (Bronze) */}
            <div className="order-3 md:order-3 flex flex-col items-center">
              <div className="w-full rounded-[28px] border-2 border-orange-200 bg-white/95 p-5 text-center shadow-lg transition-transform duration-200 hover:-translate-y-1">
                <div className="relative mx-auto mb-3 inline-block">
                  <img
                    src={top3.avatar_url}
                    alt={top3.name}
                    className="h-24 w-24 rounded-2xl object-cover ring-4 ring-orange-200 shadow-md"
                  />
                  <div className="absolute -bottom-2.5 -right-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-700 to-orange-400 text-white font-black text-sm shadow-md border-2 border-white">
                    🥉
                  </div>
                </div>

                <span className="inline-block rounded-full bg-orange-100 px-3 py-0.5 text-xs font-bold text-orange-700 mb-1.5">
                  {top3.generation_label}
                </span>
                <h3 className="font-bold text-slate-900 text-base leading-tight truncate">{top3.name}</h3>
                <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-1">{top3.position}</p>
                <p className="text-xs text-indigo-600 font-semibold truncate">{top3.company}</p>

                <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 rounded-xl p-2">
                  &ldquo;{top3.description}&rdquo;
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="text-left">
                    <span className="text-xs text-slate-400 font-medium">คะแนนโหวต</span>
                    <p className="text-base font-black text-slate-700">{top3.votes || 0}</p>
                  </div>
                  <button
                    onClick={() => handleVote(top3.id)}
                    disabled={votedIds[top3.id]}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all shadow-sm ${
                      votedIds[top3.id]
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-gradient-to-r from-orange-600 to-amber-700 text-white hover:opacity-90 active:scale-95'
                    }`}
                  >
                    {votedIds[top3.id] ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" /> โหวตแล้ว
                      </>
                    ) : (
                      <>
                        <Heart className="h-3.5 w-3.5" /> โหวต
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Podium Base 3 */}
              <div className="hidden md:flex w-full h-12 bg-gradient-to-t from-orange-300 to-orange-200 rounded-t-2xl items-center justify-center font-black text-orange-900 text-base shadow-inner">
                อันดับ 3
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== SEARCH & FILTER BAR ===== */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span>รายชื่อศิษย์เก่าในทำเนียบเกียรติยศ</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ค้นหาและร่วมโหวตสนับสนุนศิษย์เก่าทุกรุ่น
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาชื่อ, บริษัท, ตำแหน่ง, รุ่น..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 shadow-2xs"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-amber-600 py-1">
            <span className="h-3.5 w-3.5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <span>กำลังค้นหาข้อมูล...</span>
          </div>
        )}
      </section>

      {/* ===== CANDIDATES GRID ===== */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {restCandidates.map((c, index) => {
          const rank = isSearchActive ? index + 1 : index + 4;
          return (
            <div
              key={c.id}
              className="group flex flex-col justify-between rounded-[28px] border border-slate-200 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <div>
                {/* Image + Rank badge */}
                <div className="relative mb-4 overflow-hidden rounded-2xl bg-slate-100 aspect-[4/3]">
                  <img
                    src={c.avatar_url}
                    alt={c.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900/80 backdrop-blur-sm text-white font-bold text-xs shadow-md">
                    #{rank}
                  </div>
                  {c.generation_label && (
                    <div className="absolute top-3 right-3">
                      <span className="rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm">
                        {c.generation_label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-base leading-snug group-hover:text-amber-600 transition-colors">
                    {c.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{c.position}</span>
                  </div>
                  {c.company && (
                    <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{c.company}</span>
                    </div>
                  )}
                  {c.description && (
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed bg-slate-50 rounded-xl p-2.5">
                      {c.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Vote bar */}
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-medium">คะแนน:</span>
                  <span className="text-sm font-black text-slate-800">{c.votes || 0}</span>
                </div>

                <button
                  onClick={() => handleVote(c.id)}
                  disabled={votedIds[c.id]}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all shadow-2xs ${
                    votedIds[c.id]
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600 active:scale-95'
                  }`}
                >
                  {votedIds[c.id] ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> โหวตแล้ว
                    </>
                  ) : (
                    <>
                      <Heart className="h-3.5 w-3.5" /> โหวต
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {restCandidates.length === 0 && !loading && (
          <div className="col-span-full rounded-[28px] border border-slate-100 bg-white p-12 text-center text-slate-400">
            <Trophy className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-medium">ไม่พบผลลัพธ์ที่ตรงกับคำค้นหา &ldquo;{query}&rdquo;</p>
          </div>
        )}
      </section>
    </div>
  );
}