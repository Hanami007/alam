import { AdminDashboard } from '@/modules/admin/components/admin-dashboard';
import { AppShell } from '@/components/layout/app-shell';

export default function AdminPage() {
  return (
    <AppShell>
      <AdminDashboard />
    </AppShell>
  );
}