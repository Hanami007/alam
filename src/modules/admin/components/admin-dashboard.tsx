'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Image as ImageIcon,
  MessageSquare,
  ShieldCheck,
  ShieldBan,
  Star,
  Users,
  Vote,
  XCircle,
  RefreshCw,
  Sparkles,
  Megaphone,
  Layers,
  UserCheck,
} from 'lucide-react';
import { PostRequestQueue } from './post-request-queue';
import { AdminAnnouncementForm } from './admin-announcement-form';
import { KeywordFilterManager } from './keyword-filter-manager';
import { MemberList, type AdminMember } from './member-list';
import { WallWidgetManager } from './wall-widget-manager';
import { api } from '@/lib/api-client';

interface AdminDashboardProps {
  adminId?: number;
}

export function AdminDashboard({ adminId = 1 }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'announcement' | 'users' | 'members' | 'widgets' | 'keywords'>('posts');
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
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [hofCampaign, setHofCampaign] = useState<{ id: number; status: 'open' | 'closed'; title: string } | null>(null);
  const [hofToggling, setHofToggling] = useState(false);

  async function loadAdminData(showLoading = false) {
    if (showLoading) setLoading(true);
    try {
      const [statsRes, usersRes, postsRes, membersRes, hofRes] = await Promise.allSettled([
        api.admin.getOverview(),
        api.admin.getVerifications(),
        api.admin.getPostRequests(),
        api.admin.getAllUsers(),
        api.admin.getHofCampaign(),
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
      if (membersRes.status === 'fulfilled' && Array.isArray(membersRes.value)) {
        setMembers(membersRes.value);
      }
      if (hofRes.status === 'fulfilled' && hofRes.value?.campaign) {
        setHofCampaign(hofRes.value.campaign);
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
      api.admin.getAllUsers(),
      api.admin.getHofCampaign(),
    ]).then(([statsRes, usersRes, postsRes, membersRes, hofRes]) => {
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
      if (membersRes.status === 'fulfilled' && Array.isArray(membersRes.value)) {
        setMembers(membersRes.value);
      }
      if (hofRes.status === 'fulfilled' && hofRes.value?.campaign) {
        setHofCampaign(hofRes.value.campaign);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleDeleteMember(userId: number) {
    await api.admin.deleteUser(userId);
    setMembers((prev) => prev.filter((m) => m.id !== userId));
  }

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

  async function handleToggleHofCampaign() {
    if (!hofCampaign || hofToggling) return;
    const nextStatus = hofCampaign.status === 'open' ? 'closed' : 'open';
    setHofToggling(true);
    try {
      const res = await api.admin.toggleHofCampaign(nextStatus);
      if (res?.campaign) setHofCampaign(res.campaign);
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะโหวต');
    } finally {
      setHofToggling(false);
    }
  }

  return (
    <div className="animate-slide-up space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Admin System Control Center</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">ระบบจัดการสำหรับผู้ดูแลระบบ</h1>
        </div>
        <button
          onClick={() => loadAdminData(true)}
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

      {/* เปิด/ปิดการโหวต Hall of Fame */}
      {hofCampaign && (
        <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              hofCampaign.status === 'open' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
            }`}>
              <Vote className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-800">โหวตศิษย์เก่าดีเด่น: {hofCampaign.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                สถานะปัจจุบัน:{' '}
                <span className={`font-bold ${hofCampaign.status === 'open' ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {hofCampaign.status === 'open' ? 'เปิดโหวตอยู่' : 'ปิดโหวตอยู่'}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleHofCampaign}
            disabled={hofToggling}
            className={`shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer disabled:opacity-50 ${
              hofCampaign.status === 'open'
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {hofToggling ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Vote className="h-4 w-4" />
            )}
            <span>{hofCampaign.status === 'open' ? 'ปิดการโหวต' : 'เปิดการโหวต'}</span>
          </button>
        </section>
      )}

      {/* Admin Function Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('posts')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'posts'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>จัดการคำขอโพสต์วอลล์ ({postRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('announcement')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'announcement'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Megaphone className="h-4 w-4" />
          <span>สร้างประกาศทางการลงวอลล์</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>อนุมัติสมาชิกศิษย์เก่า ({pendingUsers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'members'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>รายชื่อสมาชิกทั้งหมด ({members.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('widgets')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'widgets'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>จัดการวิดเจ็ตหน้าวอลล์</span>
        </button>
        <button
          onClick={() => setActiveTab('keywords')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'keywords'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ShieldBan className="h-4 w-4" />
          <span>กรองคำไม่เหมาะสม</span>
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'posts' && (
        <PostRequestQueue requests={postRequests} adminId={adminId} onRefresh={() => loadAdminData()} />
      )}

      {activeTab === 'announcement' && (
        <AdminAnnouncementForm onSuccess={() => loadAdminData()} />
      )}

      {activeTab === 'keywords' && (
        <KeywordFilterManager />
      )}

      {activeTab === 'members' && (
        <MemberList members={members} onDelete={handleDeleteMember} />
      )}

      {activeTab === 'widgets' && (
        <WallWidgetManager />
      )}

      {activeTab === 'users' && (
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900">{u.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        (u.studentStatus || u.student_status) === 'alumni'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}>
                        {(u.studentStatus || u.student_status) === 'alumni' ? 'ศิษย์เก่า' : 'นักศึกษาปัจจุบัน'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      รหัสนักศึกษา: <span className="font-semibold text-slate-700">{u.studentId || u.student_id || 'ไม่ระบุ'}</span> · {u.generation ?? 'ยังไม่ระบุรุ่น'} {u.province ? `· ${u.province}` : ''} · {u.email}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
                      <ShieldCheck className="h-3.5 w-3.5" /> พร้อมสำหรับการอนุมัติเข้าใช้งานระบบ
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
      )}
    </div>
  );
}