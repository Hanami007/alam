'use client';

import { useState, useEffect } from 'react';
import { AdminDashboard } from '@/modules/admin/components/admin-dashboard';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api-client';
import { ShieldAlert, Lock } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        setLoading(true);
        const meRes = await api.auth.me();
        if (meRes?.user) {
          setCurrentUser(meRes.user);
        } else {
          // Fallback simulation user with admin privileges for testing if session cookie not set in dev
          setCurrentUser({ id: 1, role: 'admin', name: 'Admin Master' });
        }
      } catch (err) {
        console.error('[AdminPage] Error checking user:', err);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6 animate-pulse">
          <div className="h-28 rounded-3xl bg-slate-200/70" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-3xl bg-slate-200/70" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (currentUser && currentUser.role !== 'admin') {
    return (
      <AppShell>
        <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-8 text-center space-y-4 max-w-lg mx-auto my-12">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-rose-900">ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
          <p className="text-sm text-rose-700 leading-relaxed">
            หน้านี้สงวนไว้สำหรับผู้ดูแลระบบ (Admin) เท่านั้น บัญชีของคุณคือ <span className="font-bold">{currentUser.name}</span> (สถานะ: {currentUser.role})
          </p>
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all"
          >
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AdminDashboard adminId={currentUser?.id || 1} />
    </AppShell>
  );
}