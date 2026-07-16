import { AppShell } from '@/components/layout/app-shell';
import { DashboardGrid } from '@/modules/dashboard/components/dashboard-grid';

export default function HomePage() {
  return (
    <AppShell>
      <DashboardGrid />
    </AppShell>
  );
}
