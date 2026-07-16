import { AppShell } from '@/components/layout/app-shell';
import { HallOfFameGrid } from '@/modules/hall-of-fame/components/hall-of-fame-grid';

export default function HallOfFamePage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-blue-600">Hall of Fame</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Recognized alumni</h1>
        </div>
        <HallOfFameGrid />
      </div>
    </AppShell>
  );
}
