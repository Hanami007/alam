'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import {
  Users,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Calendar,
  GraduationCap,
  MapPin,
  Clock,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function MemberApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [batchmates, setBatchmates] = useState<any[]>([]);
  const [userGen, setUserGen] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  async function loadData(showLoading = false) {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch('/api/member/approvals');
      const data = await res.json();
      if (res.ok) {
        setBatchmates(data.pendingBatchmates || []);
        if (data.userGeneration) setUserGen(data.userGeneration);
      } else {
        setToast({ message: data.error || 'ไม่สามารถโหลดข้อมูลได้', type: 'error' });
      }
    } catch (err: any) {
      console.error('Error loading approvals:', err);
      setToast({ message: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleApprove(applicantId: number, applicantName: string) {
    setActionLoadingId(applicantId);
    try {
      const res = await fetch('/api/member/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantId }),
      });

      const data = await res.json();
      if (res.ok) {
        setBatchmates((prev) => prev.filter((b) => b.id !== applicantId));
        setToast({
          message: `ยืนยันตัวตนให้ ${applicantName} สำเร็จแล้ว ✨ เพื่อนสามารถเข้าสู่ระบบได้ทันที`,
          type: 'success',
        });
        setTimeout(() => setToast(null), 4000);
      } else {
        setToast({ message: data.error || 'ไม่สามารถยืนยันตัวตนได้', type: 'error' });
        setTimeout(() => setToast(null), 4000);
      }
    } catch (err: any) {
      setToast({ message: err.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล', type: 'error' });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <AppShell>
      <div className="animate-slide-up space-y-6 max-w-5xl mx-auto">
        {/* Floating Toast */}
        {toast && (
          <div className="fixed top-6 right-6 z-50 animate-bounce-in flex items-center gap-3 rounded-2xl bg-white/95 px-5 py-3.5 shadow-hero border border-slate-200/80 backdrop-blur-md">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            </div>
            <span className="text-sm font-bold text-slate-800">{toast.message}</span>
          </div>
        )}

        {/* Header Hero Banner */}
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-7 sm:p-8 text-white shadow-xl">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-indigo-200 border border-white/15">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>การยืนยันตัวตนเพื่อนร่วมรุ่น {userGen ? `(${userGen})` : ''}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                ยืนยันตัวตนเพื่อนร่วมรุ่น
              </h1>
              <p className="text-sm text-indigo-100/80 max-w-2xl leading-relaxed">
                ช่วยรับรองและยืนยันตัวตนให้เพื่อนๆ ที่สมัครเข้าสู่ระบบในรุ่นเดียวกัน เพื่อเปิดสิทธิ์ให้เพื่อนสามารถล็อกอินและร่วมใช้งานเครือข่าย CS MJU CONNECT ได้
              </p>
            </div>

            <button
              onClick={() => loadData(true)}
              disabled={loading}
              className="self-start sm:self-center inline-flex items-center gap-2 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-95 px-4 py-2.5 text-xs font-bold text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>รีเฟรชข้อมูล</span>
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="rounded-[32px] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  คำขอรอการยืนยัน
                </h2>
                <p className="text-xs text-slate-500">
                  รายชื่อเพื่อนในรุ่นที่สมัครสมาชิกและรอการรับรอง
                </p>
              </div>
            </div>

            <span className="rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-100">
              {batchmates.length} รายการ
            </span>
          </div>

          {loading ? (
            <div className="space-y-3 py-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : batchmates.length === 0 ? (
            <div className="py-14 text-center space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 shadow-xs">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">ไม่มีคำขอรอการยืนยันในรุ่นของคุณ</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  เพื่อนร่วมรุ่นทุกคนในรุ่นของคุณได้รับการยืนยันตัวตนเรียบร้อยแล้ว หรือยังไม่มีผู้สมัครใหม่ในรุ่นนี้
                </p>
              </div>
              <Link
                href="/feed"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
              >
                <span>กลับสู่ฟีดข่าวสาร</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {batchmates.map((b) => (
                <div
                  key={b.id}
                  className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 hover:bg-white hover:shadow-md hover:border-indigo-200 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-extrabold text-base shadow-md">
                      {b.name.charAt(0)}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-bold text-slate-900 truncate">{b.name}</p>
                        <span className="rounded-full bg-indigo-100/80 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                          {b.generation || 'รุ่นของคุณ'}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          b.student_status === 'alumni'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}>
                          {b.student_status === 'alumni' ? 'ศิษย์เก่า' : 'นักศึกษาปัจจุบัน'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <GraduationCap className="h-3.5 w-3.5 text-indigo-600" />
                          รหัสนักศึกษา: {b.student_id || '-'}
                        </span>
                        {b.province && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-rose-500" />
                            {b.province}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          สมัครเมื่อ: {new Date(b.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                    <button
                      onClick={() => handleApprove(b.id, b.name)}
                      disabled={actionLoadingId === b.id}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:opacity-95 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {actionLoadingId === b.id ? (
                        <>
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>กำลังยืนยัน...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>ยืนยันตัวตนเพื่อนร่วมรุ่น</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
