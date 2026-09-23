'use client';

interface StatsWidgetProps {
  totalAlumni: number;
  outstandingAlumni: number;
}

export function StatsWidget({ totalAlumni, outstandingAlumni }: StatsWidgetProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-card transition-all duration-200 text-center">
        <p className="text-xs font-medium text-slate-400">ศิษย์เก่าในระบบ</p>
        <p className="mt-0.5 text-lg font-extrabold text-slate-800">{totalAlumni}</p>
      </div>
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-card transition-all duration-200 text-center">
        <p className="text-xs font-medium text-slate-400">ศิษย์เก่าดีเด่น</p>
        <p className="mt-0.5 text-lg font-extrabold text-pink-500">{outstandingAlumni}</p>
      </div>
    </div>
  );
}
