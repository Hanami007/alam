'use client';
import { useState, useEffect, useRef } from 'react';

interface Candidate {
  id: number;
  name: string;
  company: string;
  position: string;
  avatar_url: string;
  description: string;
  generation_label: string;
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

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ค้นหาชื่อ, บริษัท, ตำแหน่ง, รุ่น, ผลงาน..."
        className="input-base w-full"
      />
      {loading && <p className="mt-2 text-sm text-slate-400">กำลังค้นหา...</p>}

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {candidates.map((c) => (
          <div key={c.id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <img src={c.avatar_url} alt={c.name} className="h-36 w-full rounded-2xl object-cover" />
            <div className="mt-3">
              <p className="font-semibold text-slate-900">{c.name}</p>
              <p className="text-sm text-slate-500">{c.position} · {c.company}</p>
              <p className="text-xs text-slate-400">{c.generation_label}</p>
              <p className="mt-2 text-sm text-slate-600">{c.description}</p>
            </div>
          </div>
        ))}
        {candidates.length === 0 && !loading && (
          <p className="col-span-full text-sm text-slate-400">ไม่พบผลลัพธ์</p>
        )}
      </div>
    </div>
  );
}