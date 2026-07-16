import { AppShell } from '@/components/layout/app-shell';

export default function SearchPage() {
  return (
    <AppShell>
      <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-blue-600">Search</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Global search experience</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
          Search all alumni, generations, posts, awards, photos, and provinces from a single extensible entry point.
        </p>
      </div>
    </AppShell>
  );
}
