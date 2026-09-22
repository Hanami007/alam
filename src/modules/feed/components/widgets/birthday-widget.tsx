'use client';

import { PartyPopper } from 'lucide-react';

export interface BirthdayAlumnus {
  id: number;
  name: string;
  gen: string;
  date: string;
  avatar: string;
}

interface BirthdayWidgetProps {
  alumni: BirthdayAlumnus[];
  wishedIds: Record<number, boolean>;
  onSendWish: (id: number, e?: React.MouseEvent) => void;
  dateLabel?: string;
}

export function BirthdayWidget({ alumni, wishedIds, onSendWish, dateLabel }: BirthdayWidgetProps) {
  const todayLabel =
    dateLabel ||
    new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

  return (
    <div className="rounded-[26px] border border-pink-200/70 bg-gradient-to-b from-pink-50/60 via-white to-white p-4.5 shadow-card transition-all duration-200">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <PartyPopper className="h-4 w-4 text-pink-500" />
          <span>สุขสันต์วันเกิดวันนี้ 🎉</span>
        </h3>
        <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-bold text-pink-600">
          {todayLabel}
        </span>
      </div>

      <div className="mt-2.5 space-y-2">
        {alumni.length === 0 ? (
          <p className="text-xs text-slate-400 py-2 text-center">วันนี้ยังไม่มีใครวันเกิดในระบบ</p>
        ) : (
        alumni.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-2xl border border-pink-100/60 bg-white p-2 shadow-2xs hover:border-pink-200 transition-all"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-pink-400 to-rose-400 font-bold text-white text-xs shadow-2xs">
                {item.avatar}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{item.name}</p>
                <p className="text-xs text-slate-400">{item.gen} • 🎂 {item.date}</p>
              </div>
            </div>

            <button
              onClick={(e) => onSendWish(item.id, e)}
              disabled={wishedIds[item.id]}
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all ${wishedIds[item.id]
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-2xs hover:opacity-90 active:scale-95'
                }`}
            >
              {wishedIds[item.id] ? 'ส่งแล้ว ✨' : '🎉 อวยพร'}
            </button>
          </div>
        ))
        )}
      </div>
    </div>
  );
}
