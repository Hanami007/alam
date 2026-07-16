import { AppShell } from '@/components/layout/app-shell';

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-blue-600">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Administration & platform preferences</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
          This area is ready for RBAC, notification preferences, privacy controls, and future module toggles.
        </p>
      </div>
    </AppShell>
  );
}
