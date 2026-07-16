import { alumniProfiles } from '@/lib/data';
import { Search, SlidersHorizontal } from 'lucide-react';

export function HallOfFameGrid() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
          <Search className="h-4 w-4" />
          <input placeholder="Search alumni" className="w-56 border-none bg-transparent outline-none" />
        </label>
        <button className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
          <SlidersHorizontal className="h-4 w-4" /> Filter & Sort
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {alumniProfiles.map((profile) => (
          <article key={profile.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <img src={profile.image} alt={profile.name} className="h-48 w-full object-cover" />
            <div className="p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-slate-900">{profile.name}</h3>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">{profile.generation}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{profile.department} · {profile.faculty}</p>
              <p className="mt-3 text-sm text-slate-600">{profile.occupation} · {profile.company}</p>
              <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm leading-7 text-slate-600">{profile.achievement}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
