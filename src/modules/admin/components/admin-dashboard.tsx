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
  Bell,
  PartyPopper,
  AlertTriangle,
  ArrowRight,
  History,
} from 'lucide-react';
import { PostRequestQueue } from './post-request-queue';
import { AdminAnnouncementForm } from './admin-announcement-form';
import { KeywordFilterManager } from './keyword-filter-manager';
import { MemberList, type AdminMember } from './member-list';
import { WallWidgetManager } from './wall-widget-manager';
import { HofCampaignManager } from './hof-campaign-manager';
import { AuditLog } from './audit-log';
import { api } from '@/lib/api-client';

interface AdminDashboardProps {
  adminId?: number;
}

export function AdminDashboard({ adminId = 1 }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'announcement' | 'users' | 'members' | 'widgets' | 'keywords' | 'hof' | 'audit'>('posts');
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
  // กันกดปฏิเสธพลาด — ต้องกดยืนยันซ้ำอีกครั้งก่อนถึงจะยิง API จริง (ต่างจากอนุมัติที่กดครั้งเดียวได้เลย
  // เพราะปฏิเสธทำผิดพลาดแล้วแก้คืนยากกว่า ผู้สมัครต้องสมัครใหม่)
  const [confirmingRejectId, setConfirmingRejectId] = useState<number | null>(null);

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
    setConfirmingRejectId(null);
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

  // เดิมรวม postRequests.length (โพสต์ที่เผยแพร่แล้ว) เข้ามานับเป็น "งานรอดำเนินการ" ด้วย แต่โพสต์
  // ในระบบนี้เผยแพร่อัตโนมัติทันทีตั้งแต่สร้าง ไม่มีคิวอนุมัติจริง — จำนวนโพสต์จึงไม่ใช่งานค้าง
  // เหลือแค่สมาชิกที่รออนุมัติเท่านั้นที่เป็น "งานรอดำเนินการ" จริงๆ
  const totalPendingActions = pendingUsers?.length || 0;

  /** พาแอดมินกระโดดไปแท็บอนุมัติสมาชิก (คลิกจากการ์ดสถิติ/แบนเนอร์แจ้งเตือน) */
  function jumpToPendingTab() {
    setActiveTab('users');
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

      {/* แบนเนอร์สรุปงานค้าง — บอกทันทีว่าวันนี้แอดมินต้องทำอะไรบ้าง ไม่ต้องไล่เดาทีละแท็บ */}
      {loading ? null : totalPendingActions > 0 ? (
        <div className="rounded-[28px] border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 animate-pulse">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-amber-900">
                มีสมาชิกรออนุมัติ {totalPendingActions} คน
              </p>
              <p className="text-xs text-amber-700 mt-0.5">สมัครสมาชิกใหม่รอการตรวจสอบและอนุมัติจากคุณ</p>
            </div>
          </div>
          <button
            onClick={jumpToPendingTab}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-amber-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-xs hover:bg-amber-700 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            ไปจัดการเลย <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-5 flex items-center gap-3.5">
          <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <PartyPopper className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-emerald-900">เรียบร้อยดีครับ ไม่มีรายการรอดำเนินการ 🎉</p>
            <p className="text-xs text-emerald-700 mt-0.5">คำขออนุมัติสมาชิกทั้งหมดถูกจัดการครบแล้ว</p>
          </div>
        </div>
      )}

      {/* สถิติภาพรวม — การ์ดที่กดได้ (คำขอรออนุมัติ/สมาชิก/HOF) จะพาไปแท็บที่เกี่ยวข้องทันที */}
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'ศิษย์เก่าอนุมัติแล้ว',
            value: stats.totalAlumni,
            icon: Users,
            color: 'text-indigo-600 bg-indigo-50',
            onClick: () => setActiveTab('members'),
          },
          {
            label: 'รุ่นศิษย์เก่าทั้งหมด',
            value: stats.totalGenerations,
            icon: Star,
            color: 'text-amber-600 bg-amber-50',
          },
          {
            // เดิม query นับ hof_candidates สะสมทุกแคมเปญตลอดกาล (โตขึ้นเรื่อยๆ ไม่เคยลด และไม่ได้
            // แปลว่า "ดีเด่น/ชนะแล้ว" เพราะระบบไม่มีสถานะผู้ชนะ) ตอนนี้ backend จำกัดเฉพาะแคมเปญ
            // ล่าสุดแล้ว จึงเปลี่ยนป้ายให้ตรงความหมายจริง: "ผู้เข้าชิง" ไม่ใช่ "ผู้ได้รับเลือก"
            label: 'ผู้เข้าชิง HOF รอบนี้',
            value: stats.outstandingAlumni,
            icon: Sparkles,
            color: 'text-purple-600 bg-purple-50',
            onClick: () => setActiveTab('hof'),
          },
          {
            // สมาชิกรออนุมัติเป็น "งานค้าง" จริงเพียงอย่างเดียว (โพสต์เผยแพร่อัตโนมัติ ไม่มีคิวจริง
            // ดูรายละเอียดที่ totalPendingActions ด้านบน)
            label: 'สมาชิกรออนุมัติ',
            value: totalPendingActions,
            icon: ShieldCheck,
            color: 'text-rose-600 bg-rose-50',
            onClick: totalPendingActions > 0 ? jumpToPendingTab : undefined,
          },
        ].map((item) => (
          <div
            key={item.label}
            onClick={item.onClick}
            className={`rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-xs transition-all ${
              item.onClick ? 'hover:shadow-md hover:border-indigo-200 cursor-pointer active:scale-[0.98]' : ''
            }`}
          >
            <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-500">{item.label}</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900">{item.value}</p>
          </div>
        ))}
      </section>

      {/* HOF Status Quick-view — คลิกที่ Tab HOF เพื่อจัดการแบบเต็ม */}
      {hofCampaign && (
        <button
          onClick={() => setActiveTab('hof')}
          className="w-full text-left rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-amber-200 hover:bg-amber-50/30 transition-all group"
        >
          <div className="flex items-center gap-3.5">
            <div className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              hofCampaign.status === 'open' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
            }`}>
              <Vote className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-800">HOF ศิษย์เก่าดีเด่น: {hofCampaign.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                สถานะ:{' '}
                <span className={`font-bold ${hofCampaign.status === 'open' ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {hofCampaign.status === 'open' ? 'เปิดรับโหวตอยู่' : 'ปิดโหวตแล้ว'}
                </span>
                {' · '}คลิกเพื่อจัดการ (สร้างรอบ / ประกาศผล / ดูประวัติ)
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-600 group-hover:underline shrink-0">จัดการ HOF →</span>
        </button>
      )}

      {/* Admin Function Tabs — แยกกลุ่มชัดเจน: "งานรอดำเนินการ" (มีแค่สมาชิกรออนุมัติ ซึ่งเป็นงานค้างจริง
          ที่ต้องรีบทำ) กับ "เครื่องมือจัดการ" (ตั้งค่า/ดูแลทั่วไป ไม่เร่งด่วน) — เดิมเอา "จัดการคำขอโพสต์
          วอลล์" มาไว้กลุ่มเร่งด่วนด้วย ทั้งที่โพสต์เผยแพร่อัตโนมัติไม่มีคิวอนุมัติจริง ย้ายมาไว้กลุ่มเครื่องมือแทน */}
      <div className="space-y-3">
        <div>
          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 px-1">งานรอดำเนินการ</p>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'users' as const, label: 'อนุมัติสมาชิกศิษย์เก่า', icon: UserCheck, count: pendingUsers.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold ${
                      activeTab === tab.id ? 'bg-white/25 text-white' : 'bg-rose-500 text-white animate-pulse'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 px-1">เครื่องมือจัดการ</p>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'posts' as const, label: `จัดการโพสต์บนวอลล์ (${postRequests.length})`, icon: Layers },
              { id: 'announcement' as const, label: 'สร้างประกาศทางการ', icon: Megaphone },
              { id: 'members' as const, label: `รายชื่อสมาชิกทั้งหมด (${members.length})`, icon: Users },
              { id: 'hof' as const, label: 'HOF ศิษย์เก่าดีเด่น', icon: Vote },
              { id: 'widgets' as const, label: 'วิดเจ็ตหน้าวอลล์', icon: Sparkles },
              { id: 'keywords' as const, label: 'กรองคำไม่เหมาะสม', icon: ShieldBan },
              { id: 'audit' as const, label: 'ประวัติการดำเนินการ', icon: History },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
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

      {activeTab === 'hof' && (
        <HofCampaignManager />
      )}

      {activeTab === 'widgets' && (
        <WallWidgetManager />
      )}

      {activeTab === 'audit' && (
        <AuditLog />
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
                  {confirmingRejectId === u.id ? (
                    <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                      <span className="text-[11px] font-bold text-rose-700">ยืนยันปฏิเสธ &ldquo;{u.name}&rdquo;?</span>
                      <button
                        disabled={actionLoadingId === u.id}
                        onClick={() => handleUserVerification(u.id, 'rejected')}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-extrabold text-white hover:bg-rose-700 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {actionLoadingId === u.id ? 'กำลังปฏิเสธ...' : 'ยืนยัน'}
                      </button>
                      <button
                        disabled={actionLoadingId === u.id}
                        onClick={() => setConfirmingRejectId(null)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
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
                        onClick={() => setConfirmingRejectId(u.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <XCircle className="h-3.5 w-3.5" /> ปฏิเสธ
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}