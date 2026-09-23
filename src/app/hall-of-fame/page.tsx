'use client';

import { useState, useEffect } from 'react';
import { HallOfFameGrid } from '@/modules/hall-of-fame/components/hall-of-fame-grid';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api-client';

export default function HallOfFamePage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [campaignStatus, setCampaignStatus] = useState<'open' | 'closed'>('closed');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCandidates() {
      try {
        setLoading(true);
        const res = await api.hof.getCandidates();
        // /api/hof เดิมคืน array ตรงๆ ตอนนี้เปลี่ยนเป็น { candidates, campaignStatus } เพื่อให้
        // หน้านี้รู้ว่าตอนนี้เปิดโหวตอยู่ไหม — เผื่อ response เก่าที่ยังเป็น array (เช่น cache ค้าง) ไว้ด้วย
        const data = Array.isArray(res) ? res : res?.candidates;
        setCampaignStatus(!Array.isArray(res) && res?.campaignStatus === 'open' ? 'open' : 'closed');
        if (Array.isArray(data)) {
          const formatted = data.map((p: any) => {
            const genLabel: string = p.generation || p.generation_label || '';
            const genMatch = genLabel.match(/(\d+)/);
            const generationNumber = genMatch ? parseInt(genMatch[1], 10) : undefined;

            return {
              id: p.id,
              name: p.name,
              studentId: p.studentId || p.student_id || undefined,
              company: p.company || '',
              position: p.position || p.occupation || 'ศิษย์เก่า',
              avatar_url: p.avatarUrl || p.avatar_url || p.image || '',
              description: p.achievement || p.description || '',
              generation_label: genLabel,
              generationNumber,
              votes: typeof p.hofPoints === 'number' ? p.hofPoints : (typeof p.hof_points === 'number' ? p.hof_points : 0),
              employmentType: p.employmentType || p.employment_type || undefined,
            };
          });
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
        <HallOfFameGrid initialCandidates={candidates} campaignStatus={campaignStatus} />
      )}
    </AppShell>
  );
}