import { AppShell } from '@/components/layout/app-shell';
import { MapPanel } from '@/modules/map/components/map-panel';

export default function MapPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-blue-600">Alumni Map</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Province-level insights</h1>
        </div>
        <MapPanel />
      </div>
    </AppShell>
  );
}
