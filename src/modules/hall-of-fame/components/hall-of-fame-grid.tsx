'use client';
import { useState, useEffect, useRef } from 'react';
import { Trophy, Search } from 'lucide-react';

interface Candidate {
  id: number;
  name: string;
  company: string;
  position: string;
  avatar_url: string;
  description: string;
  generation_label: string;
  hof_points?: number; // จำนวนโหวตรวม (มาจาก getAlumniProfiles)
}

interface HallOfFameGridProps {
  initialCandidates: Candidate[];
}

export function HallOfFameGrid({ initialCandidates = [] }: HallOfFameGridProps) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (query.trim() === '') {
        setCandidates(initialCandidates);
        return;
      }
      setLoading(true);
      const res = await fetch(`/api/hof/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setCandidates(data.results);
      setLoading(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // เรียงตามคะแนนโหวตมากไปน้อย
  const sorted = [...candidates].sort((a, b) => (b.hof_points ?? 0) - (a.hof_points ?? 0));
  const isSearching = query.trim() !== '';

  // ตอนไม่ได้ค้นหา: โชว์แค่ podium top 3 (ตามที่ขอ ไม่ต้องมีการ์ดทุกคน)
  const podium = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <div>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาชื่อ, บริษัท, ตำแหน่ง, รุ่น, ผลงาน..."
          className="input-base w-full pl-9"
        />
      </div>
      {loading && <p className="mt-2 text-sm text-slate-400">กำลังค้นหา...</p>}

      {!isSearching && podium.length > 0 && (
        <div className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900">ศิษย์เก่าดีเด่นยอดโหวตสูงสุด</h2>
          </div>

          {/* Podium: อันดับ 2 - 1 - 3 (ตรงกลางสูงสุด) */}
          <div className="flex items-end justify-center gap-4 sm:gap-6">
            {[podium[1], podium[0], podium[2]].map((c, idx) => {
              if (!c) return <div key={idx} className="w-40" />;
              const rank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
              const heightClass = rank === 1 ? 'pt-0' : rank === 2 ? 'pt-6' : 'pt-10';
              const badgeColor =
                rank === 1 ? 'bg-amber-400 text-white' : rank === 2 ? 'bg-slate-300 text-slate-700' : 'bg-orange-300 text-orange-900';
              const ringColor = rank === 1 ? 'ring-amber-400' : rank === 2 ? 'ring-slate-300' : 'ring-orange-300';

              return (
                <div key={c.id} className={`flex w-36 flex-col items-center text-center sm:w-44 ${heightClass}`}>
                  <div className={`relative rounded-full ring-4 ${ringColor}`}>
                    <img src={c.avatar_url} alt={c.name} className={`rounded-full object-cover ${rank === 1 ? 'h-24 w-24 sm:h-28 sm:w-28' : 'h-20 w-20 sm:h-24 sm:w-24'}`} />
                    <span className={`absolute -top-2 -right-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow-sm ${badgeColor}`}>
                      {rank}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.position}</p>
                  <p className="text-xs text-slate-400">{c.company}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{c.generation_label}</p>
                  <p className="mt-1 text-xs font-semibold text-blue-600">{c.hof_points ?? 0} คะแนนโหวต</p>
                  <p className="mt-2 line-clamp-2 text-xs text-slate-500">{c.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ผลค้นหา หรือ อันดับที่เหลือ (ถ้ามี) แสดงเป็นรายการเรียบ ๆ ไม่ต้องเป็นการ์ดใหญ่ */}
      {(isSearching ? sorted : rest).length > 0 && (
        <div className="mt-8">
          {!isSearching && <h3 className="mb-3 text-sm font-semibold text-slate-500">ศิษย์เก่าดีเด่นคนอื่น ๆ</h3>}
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {(isSearching ? sorted : rest).map((c, i) => (
              <div key={c.id} className="flex items-center gap-4 p-4">
                <span className="w-6 text-center text-sm font-medium text-slate-400">{isSearching ? i + 1 : i + 4}</span>
                <img src={c.avatar_url} alt={c.name} className="h-12 w-12 rounded-xl object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.position} · {c.company} · {c.generation_label}</p>
                </div>
                <span className="text-sm font-semibold text-blue-600">{c.hof_points ?? 0} โหวต</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {candidates.length === 0 && !loading && (
        <p className="mt-8 text-sm text-slate-400">ไม่พบผลลัพธ์</p>
      )}
    </div>
  );
}