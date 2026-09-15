'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminDashboard } from '@/modules/admin/components/admin-dashboard';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api-client';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        setLoading(true);
        const meRes = await api.auth.me().catch(() => null);
        if (meRes?.user) {
          setCurrentUser(meRes.user);
          if (meRes.user.role !== 'admin') {
            router.replace('/feed');
          }
        } else {
          setCurrentUser(null);
          router.replace('/login?callbackUrl=/admin');
        }
      } catch (err) {
        console.error('[AdminPage] Error checking user:', err);
        setCurrentUser(null);
        router.replace('/feed');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

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

  if (!currentUser) {
    return (
      <AppShell>
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 text-center space-y-4 max-w-lg mx-auto my-12 shadow-xs">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            หน้านี้สงวนไว้สำหรับผู้ดูแลระบบ (Admin) เท่านั้น กรุณาเข้าสู่ระบบด้วยบัญชีแอดมินเพื่อเข้าใช้งาน
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/login?callbackUrl=/admin"
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/feed"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-all"
            >
              กลับหน้าหลัก
            </Link>
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