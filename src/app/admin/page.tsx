import { getCurrentUser } from '@/lib/auth';
import { AdminDashboard } from '@/modules/admin/components/admin-dashboard';
import { AppShell } from '@/components/layout/app-shell';
import { redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';

export default async function AdminPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login?callbackUrl=/admin');
  }

  if (currentUser.role !== 'admin') {
    return (
      <AppShell>
        <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-8 text-center space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-rose-900">ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
          <p className="text-sm text-rose-700">หน้านี้สงวนไว้สำหรับผู้ดูแลระบบ (Admin) เท่านั้น</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AdminDashboard adminId={currentUser.id} />
    </AppShell>
  );
}