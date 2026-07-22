import { Crown, Medal, Search, SlidersHorizontal } from 'lucide-react';
import { getAlumniProfiles } from '@/lib/db';

const PODIUM_STYLE = [
  { badge: 'bg-gradient-to-br from-[#FFD76A] to-[#FFB020]', icon: Crown, label: '#1' },
  { badge: 'bg-gradient-to-br from-[#B9C4D0] to-[#8CA0B3]', icon: Medal, label: '#2' },
  { badge: 'bg-gradient-to-br from-[#E3A26B] to-[#C97B3D]', icon: Medal, label: '#3' },
];

export async function HallOfFameGrid() {
  const ranked = await getAlumniProfiles();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white bg-white p-4 shadow-sm">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-[#F5FAFF] px-3.5 py-2.5 text-sm text-slate-400">
          <Search className="h-4 w-4" />
          <input placeholder="ค้นหาศิษย์เก่าเพื่อโหวต" className="w-56 border-none bg-transparent outline-none" />
        </label>
        <button className="flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-600">
          <SlidersHorizontal className="h-4 w-4" /> กรอง / เรียงลำดับ
        </button>
      </div>

      {/* Podium */}
      <div className="overflow-hidden rounded-[28px] border border-white bg-gradient-to-br from-white to-[#F5FAFF] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#0099FF]">แคมเปญ 2569</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-900">Top 3 ศิษย์เก่าดีเด่น</h3>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {ranked.slice(0, 3).map((profile, index) => {
            const style = PODIUM_STYLE[index];
            const Icon = style.icon;
            return (
              <div
                key={profile.id}
                className="relative overflow-hidden rounded-2xl border border-white bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-20 ${style.badge}`} />
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-md ${style.badge}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{profile.name}</p>
                <p className="text-xs text-slate-400">{profile.generation}</p>
                <p className="mt-2 text-lg font-bold text-[#0099FF]">{profile.hof_points} คะแนน</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {ranked.map((profile) => (
          <article
            key={profile.id}
            className="overflow-hidden rounded-[28px] border border-white bg-white shadow-sm transition hover:shadow-xl"
          >
            <div className="relative h-48 overflow-hidden">
              <img src={profile.image} alt={profile.name} className="h-full w-full object-cover transition duration-300 hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#0099FF]">
                {profile.generation}
              </span>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-slate-900">{profile.name}</h3>
                <span className="rounded-full bg-[#EAF6FF] px-2.5 py-1 text-xs font-semibold text-[#0099FF]">
                  {profile.hof_points} คะแนน
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {profile.occupation} · {profile.company}
              </p>
              <p className="mt-3 rounded-2xl bg-[#F5FAFF] p-3 text-sm leading-7 text-slate-600">{profile.achievement}</p>

              <div className="mt-4 flex gap-2">
                <button className="flex-1 rounded-xl bg-[#EAF6FF] px-3 py-2.5 text-xs font-semibold text-[#0099FF] transition hover:bg-[#D6ECFF]">
                  โหวตในรุ่น (+5)
                </button>
                <button className="flex-1 rounded-xl bg-gradient-to-r from-[#0099FF] to-[#1E90FF] px-3 py-2.5 text-xs font-semibold text-white shadow-md shadow-[#0099FF]/25">
                  โหวตนอกรุ่น (+10)
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}