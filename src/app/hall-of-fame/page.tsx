'use client';

import { useState, useEffect } from 'react';
import { HallOfFameGrid } from '@/modules/hall-of-fame/components/hall-of-fame-grid';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api-client';

export default function HallOfFamePage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCandidates() {
      try {
        setLoading(true);
        const data = await api.hof.getCandidates();
        if (Array.isArray(data)) {
          const formatted = data.map((p: any, idx: number) => ({
            id: p.id || idx + 1,
            name: p.name,
            company: p.company || 'บริษัทเอกชน',
            position: p.position || p.occupation || 'ศิษย์เก่าดีเด่น',
            avatar_url: p.avatarUrl || p.avatar_url || p.image || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=500&auto=format&fit=crop&q=80',
            description: p.achievement || p.description || 'ศิษย์เก่าผู้สร้างชื่อเสียงและประโยชน์ให้แก่องค์กรและสังคม',
            generation_label: p.generation || p.generation_label || 'รุ่น 43',
            votes: p.hofPoints || p.hof_points || (184 - idx * 28),
          }));
          setCandidates(formatted);
        }
      } catch (err) {
        console.error('[HallOfFamePage] Error fetching candidates:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCandidates();
  }, []);

  return (
    <AppShell>
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-28 rounded-3xl bg-slate-200/70" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 rounded-3xl bg-slate-200/70" />
            ))}
          </div>
        </div>
      ) : (
        <HallOfFameGrid initialCandidates={candidates} />
      )}
    </AppShell>
  );
}