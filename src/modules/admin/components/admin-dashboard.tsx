'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Image as ImageIcon,
  MessageSquare,
  ShieldCheck,
  Star,
  Users,
  Vote,
  XCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { PostRequestQueue } from './post-request-queue';
import { api } from '@/lib/api-client';

interface AdminDashboardProps {
  adminId?: number;
}

export function AdminDashboard({ adminId = 1 }: AdminDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    totalAlumni: 0,
    totalGenerations: 0,
    outstandingAlumni: 0,
    pendingApprovals: 0,
    pendingPostRequests: 0,
  });
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [postRequests, setPostRequests] = useState<any[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  async function loadAdminData(showLoading = false) {
    if (showLoading) setLoading(true);
    try {
      const [statsRes, usersRes, postsRes] = await Promise.allSettled([
        api.admin.getOverview(),
        api.admin.getVerifications(),
        api.admin.getPostRequests(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setStats(statsRes.value);
      }
      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
        setPendingUsers(usersRes.value);
      }
      if (postsRes.status === 'fulfilled' && Array.isArray(postsRes.value)) {
        setPostRequests(postsRes.value.map((p: any) => ({
          id: p.id,
          title: p.title,
          content: p.body,
          category: p.category,
          post_type: p.postType || (p.category === 'โพลสำรวจความเห็น' ? 'poll' : 'normal'),
          requester_name: p.authorName,
          created_at: p.createdAt,
          poll: p.poll,
        })));
      }
    } catch (err) {
      console.error('[AdminDashboard] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([
      api.admin.getOverview(),
      api.admin.getVerifications(),
      api.admin.getPostRequests(),
    ]).then(([statsRes, usersRes, postsRes]) => {
      if (!isMounted) return;
      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setStats(statsRes.value);
      }
      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
        setPendingUsers(usersRes.value);
      }
      if (postsRes.status === 'fulfilled' && Array.isArray(postsRes.value)) {
        setPostRequests(postsRes.value.map((p: any) => ({
          id: p.id,
          title: p.title,
          content: p.body,
          category: p.category,
          post_type: p.postType || (p.category === 'โพลสำรวจความเห็น' ? 'poll' : 'normal'),
          requester_name: p.authorName,
          created_at: p.createdAt,
          poll: p.poll,
        })));
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleUserVerification(userId: number, decision: 'approved' | 'rejected') {
    setActionLoadingId(userId);
    try {
      await api.admin.verifyUser(userId, decision);
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
      setStats((prev: any) => ({
        ...prev,
        pendingApprovals: Math.max(0, (prev.pendingApprovals || 1) - 1),
        totalAlumni: decision === 'approved' ? (prev.totalAlumni || 0) + 1 : prev.totalAlumni,
      }));
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการดำเนินการ');
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="animate-slide-up space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Admin Control Center</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">แดชบอร์ดจัดการระบบ</h1>
        </div>
        <button
          onClick={() => loadAdminData()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-slate-700 border border-slate-200 shadow-xs hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {/* สถิติภาพรวม */}
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'ศิษย์เก่าอนุมัติแล้ว', value: stats.totalAlumni, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'รุ่นศิษย์เก่าทั้งหมด', value: stats.totalGenerations, icon: Star, color: 'text-amber-600 bg-amber-50' },
          { label: 'ศิษย์เก่าดีเด่น (HOF)', value: stats.outstandingAlumni, icon: Sparkles, color: 'text-purple-600 bg-purple-50' },
          { label: 'คำขอรออนุมัติ', value: (stats.pendingApprovals || 0) + (stats.pendingPostRequests || 0), icon: ShieldCheck, color: 'text-rose-600 bg-rose-50' },
        ].map((item) => (
          <div key={item.label} className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-all">
            <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-500">{item.label}</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900">{item.value}</p>
          </div>
        ))}
      </section>

      {/* คำขอสร้างโพสต์ */}
      <PostRequestQueue requests={postRequests} adminId={adminId} onRefresh={() => loadAdminData()} />

      {/* คิวอนุมัติศิษย์เก่า */}
      <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">รออนุมัติ</p>
            <h2 className="text-lg font-bold text-slate-900">คิวอนุมัติศิษย์เก่าใหม่ (Student Verification)</h2>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600 border border-indigo-100">
            {pendingUsers.length} รายการ
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {pendingUsers.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-6 text-center text-xs text-slate-400">ไม่มีรายการรออนุมัติตอนนี้</p>
          ) : (
            pendingUsers.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50/80 border border-slate-100 p-4 hover:bg-white transition-all">
                <div>
                  <p className="text-sm font-bold text-slate-900">{u.name}</p>
                  <p className="text-xs text-slate-500">
                    รหัสนักศึกษา: <span className="font-semibold text-slate-700">{u.studentId || 'ไม่ระบุ'}</span> · {u.generation ?? 'ยังไม่ระบุรุ่น'} · {u.email}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
                    <ShieldCheck className="h-3.5 w-3.5" /> ตรวจสอบเทียบกับฐานข้อมูล apimju เรียบร้อย
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={actionLoadingId === u.id}
                    onClick={() => handleUserVerification(u.id, 'approved')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> อนุมัติ
                  </button>
                  <button
                    disabled={actionLoadingId === u.id}
                    onClick={() => handleUserVerification(u.id, 'rejected')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5" /> ปฏิเสธ
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}