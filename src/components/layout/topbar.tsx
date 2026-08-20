import { Bell, Search, PlusCircle } from 'lucide-react';

export function Topbar() {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs text-slate-500 shadow-xs">
          <Search className="h-3.5 w-3.5" />
          <input
            aria-label="Search alumni"
            placeholder="Search alumni, posts..."
            className="w-48 border-none bg-transparent outline-none"
          />
        </label>
        <button className="rounded-2xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50">
          <Bell className="h-4 w-4" />
        </button>
        <button className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">
          <PlusCircle className="h-4 w-4" />
          New Post
        </button>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">NP</div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Nattaya P.</p>
            <p className="text-xs text-slate-500">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
