'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Trophy, Medal, Crown, ChevronDown, ChevronUp, Calendar, Users, ArrowLeft } from 'lucide-react';

interface HofResultEntry {
  rank: number;
  name: string;
  avatar_url?: string;
  company?: string;
  position?: string;
  generation?: string;
  achievement?: string;
  total_votes: number;
}

interface HofCycle {
  campaign_id: number;
  title: string;
  quarter: string | null;
  period_start: string | null;
  period_end: string | null;
  finalized_at: string | null;
  total_votes: number;
  top10: HofResultEntry[];
}

function formatDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-md shadow-amber-200">
      <Crown className="h-5 w-5 text-white" />
    </div>
  );
  if (rank === 2) return (
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-400 to-slate-500 shadow-md shadow-slate-200">
      <Medal className="h-5 w-5 text-white" />
    </div>
  );
  if (rank === 3) return (
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-700 to-amber-800 shadow-md shadow-amber-100">
      <Medal className="h-5 w-5 text-white" />
    </div>
  );
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
      <span className="text-sm font-extrabold text-slate-500">{rank}</span>
    </div>
  );
}

function ResultCard({ entry, isTop3 }: { entry: HofResultEntry; isTop3: boolean }) {
  return (
    <div className={`flex items-center gap-4 rounded-2xl border p-4 transition-all hover:shadow-md ${
      isTop3
        ? 'border-amber-100 bg-gradient-to-r from-amber-50/60 to-white'
        : 'border-slate-100 bg-white hover:border-slate-200'
    }`}>
      <RankBadge rank={entry.rank} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {entry.avatar_url && (
            <img
              src={entry.avatar_url}
              alt={entry.name}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-white shadow-sm"
            />
          )}
          <p className={`font-extrabold truncate ${isTop3 ? 'text-slate-900 text-base' : 'text-slate-800 text-sm'}`}>
            {entry.name}
          </p>
          {entry.generation && (
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100">
              {entry.generation}
            </span>
          )}
        </div>
        {(entry.position || entry.company) && (
          <p className="mt-0.5 text-xs text-slate-500 truncate">
            {entry.position}{entry.position && entry.company ? ' · ' : ''}{entry.company}
          </p>
        )}
        {entry.achievement && (
          <p className="mt-1 text-xs text-slate-400 italic line-clamp-2">"{entry.achievement}"</p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <p className={`font-extrabold tabular-nums ${isTop3 ? 'text-amber-600 text-lg' : 'text-slate-700 text-sm'}`}>
          {entry.total_votes.toLocaleString()}
        </p>
        <p className="text-[10px] text-slate-400">โหวต</p>
      </div>
    </div>
  );
}

function CycleSection({ cycle, defaultOpen }: { cycle: HofCycle; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const top3 = cycle.top10.slice(0, 3);
  const rest = cycle.top10.slice(3);

  return (
    <section className={`rounded-[28px] border bg-white shadow-xs transition-all ${
      defaultOpen ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-slate-200'
    }`}>
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left"
      >
        <div className="flex items-center gap-3.5">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            defaultOpen ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
          }`}>
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-extrabold text-slate-900">{cycle.title}</p>
              {defaultOpen && (
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700">
                  ล่าสุด
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-400 flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              {formatDate(cycle.period_start)} – {formatDate(cycle.period_end)}
              {cycle.total_votes > 0 && (
                <>
                  <span>·</span>
                  <Users className="h-3 w-3" />
                  {cycle.total_votes.toLocaleString()} โหวตรวม
                </>
              )}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-slate-400">
          {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {/* TOP 3 Preview (always shown) */}
      {!open && cycle.top10.length > 0 && (
        <div className="border-t border-slate-50 px-5 pb-4">
          <div className="flex items-center gap-2 mt-3">
            {top3.map((r) => (
              <div key={r.rank} className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-1.5">
                <RankBadge rank={r.rank} />
                <p className="text-xs font-bold text-slate-700 truncate max-w-[80px]">{r.name}</p>
              </div>
            ))}
            {cycle.top10.length > 3 && (
              <p className="text-xs text-slate-400">+{cycle.top10.length - 3} คน</p>
            )}
          </div>
        </div>
      )}

      {/* Full results */}
      {open && (
        <div className="border-t border-slate-100 p-5 space-y-3">
          {cycle.top10.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-400">ยังไม่มีผลประกาศ</p>
          ) : (
            <>
              {/* TOP 3 highlighted */}
              <div className="space-y-2">
                {top3.map((entry) => (
                  <ResultCard key={entry.rank} entry={entry} isTop3={true} />
                ))}
              </div>
              {/* 4-10 */}
              {rest.length > 0 && (
                <>
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex-1 h-px bg-slate-100" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">อันดับ 4–10</p>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>
                  <div className="space-y-2">
                    {rest.map((entry) => (
                      <ResultCard key={entry.rank} entry={entry} isTop3={false} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

export default function HofResultsPage() {
  const [cycles, setCycles] = useState<HofCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/hof/results/history');
        const data = await res.json();
        if (data.success) setCycles(data.cycles);
        else setError(data.error || 'โหลดข้อมูลไม่สำเร็จ');
      } catch {
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6 animate-slide-up">
        {/* Header */}
        <div>
          <Link
            href="/hall-of-fame"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> กลับไปยัง Hall of Fame
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-md shadow-amber-200">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">ผล TOP 10 ทุกรอบ</h1>
              <p className="text-sm text-slate-500">ประวัติศิษย์เก่าดีเด่นประจำทุกไตรมาส</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-[28px] bg-slate-100" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[28px] border border-rose-100 bg-rose-50 p-8 text-center">
            <p className="text-sm font-bold text-rose-700">{error}</p>
          </div>
        ) : cycles.length === 0 ? (
          <div className="rounded-[28px] border-2 border-dashed border-slate-200 p-12 text-center space-y-3">
            <Trophy className="h-12 w-12 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-500">ยังไม่มีผลประกาศ TOP 10</p>
            <p className="text-sm text-slate-400">ผลจะปรากฏที่นี่หลังจากปิดรอบโหวตและประกาศผลแล้ว</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cycles.map((cycle, i) => (
              <CycleSection key={cycle.campaign_id} cycle={cycle} defaultOpen={i === 0} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
