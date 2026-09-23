'use client';

import Link from 'next/link';
import { Trophy } from 'lucide-react';

export interface LeaderboardEntry {
  id: number;
  name: string;
  generation: string | null;
  points: number;
  avatar: string | null;
}

interface LeaderboardWidgetProps {
  entries: LeaderboardEntry[];
}

const RANK_BADGE = ['🥇', '🥈', '🥉'];

export function LeaderboardWidget({ entries }: LeaderboardWidgetProps) {
  const top = entries.slice(0, 3);

  return (
    <div className="rounded-[26px] border border-amber-200/70 bg-gradient-to-b from-amber-50/50 via-white to-white p-4.5 shadow-card transition-all duration-200">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span>ศิษย์เก่าดีเด่น Top 3 🏆</span>
        </h3>
        <Link href="/hall-of-fame" className="text-xs font-medium text-amber-600 hover:underline">
          ดูทั้งหมด
        </Link>
      </div>

      <div className="mt-2.5 space-y-2">
        {top.length === 0 ? (
          <p className="text-xs text-slate-400 py-2 text-center">ยังไม่มีผู้ได้รับการเสนอชื่อ Hall of Fame</p>
        ) : (
          top.map((item, idx) => (
            <div
              key={item.id}
              className={`flex items-center justify-between rounded-2xl p-2 border transition-all ${idx === 0
                  ? 'bg-gradient-to-r from-amber-50/80 to-amber-100/40 border-amber-200 shadow-2xs'
                  : idx === 1
                    ? 'bg-slate-50/80 border-slate-200'
                    : 'bg-orange-50/40 border-orange-100'
                }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm shrink-0">{RANK_BADGE[idx]}</span>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-white text-xs">
                  {item.avatar || item.name.slice(0, 2)}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.generation || 'ไม่ระบุรุ่น'}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs font-extrabold text-amber-600">{item.points}</p>
                <p className="text-xs text-slate-400">คะแนนโหวต</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
