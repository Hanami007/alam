'use client';

import { useState, useEffect } from 'react';
import {
  History,
  Loader2,
  UserCheck,
  UserX,
  Trash2,
  FileCheck,
  FileX,
  Trophy,
  Vote,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { api } from '@/lib/api-client';

interface AuditLogRow {
  id: number;
  action: string;
  target_type: string | null;
  target_id: number | null;
  metadata: Record<string, any> | null;
  created_at: string;
  actor_name: string | null;
  target_user_name: string | null;
  target_post_title: string | null;
  target_campaign_title: string | null;
}

const ACTION_INFO: Record<string, { label: string; icon: any; color: string }> = {
  approve_user: { label: 'อนุมัติสมาชิก', icon: UserCheck, color: 'text-emerald-600 bg-emerald-50' },
  reject_user: { label: 'ปฏิเสธสมาชิก', icon: UserX, color: 'text-rose-600 bg-rose-50' },
  delete_user: { label: 'ลบสมาชิก', icon: Trash2, color: 'text-rose-600 bg-rose-50' },
  approve_post: { label: 'อนุมัติโพสต์', icon: FileCheck, color: 'text-emerald-600 bg-emerald-50' },
  reject_post: { label: 'ปฏิเสธโพสต์', icon: FileX, color: 'text-rose-600 bg-rose-50' },
  delete_post: { label: 'ลบโพสต์', icon: Trash2, color: 'text-rose-600 bg-rose-50' },
  hof_finalize: { label: 'ประกาศผล HOF', icon: Trophy, color: 'text-amber-600 bg-amber-50' },
  hof_create_cycle: { label: 'เปิดรอบโหวต HOF ใหม่', icon: Vote, color: 'text-purple-600 bg-purple-50' },
  USER_REGISTER_CONSENT: { label: 'ยืนยันความยินยอมสมัครสมาชิก', icon: ShieldCheck, color: 'text-indigo-600 bg-indigo-50' },
};
const DEFAULT_ACTION_INFO = { label: '', icon: Activity, color: 'text-slate-600 bg-slate-50' };

function getTargetLabel(log: AuditLogRow): string | null {
  if (log.target_user_name) return log.target_user_name;
  if (log.target_post_title) return `"${log.target_post_title}"`;
  if (log.target_campaign_title) return log.target_campaign_title;
  // สมาชิกที่ถูกลบไปแล้ว join หาชื่อจาก users ไม่เจออีกต่อไป — ใช้ชื่อที่บันทึกสำรองไว้ตอนลบแทน
  if (log.action === 'delete_user' && log.metadata?.name) return log.metadata.name;
  return log.target_id ? `#${log.target_id}` : null;
}

function formatRelativeTimeTH(dateStr: string): string {
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return '';
  const diffMin = Math.floor((Date.now() - then) / 60000);
  if (diffMin < 1) return 'เมื่อสักครู่';
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} ชั่วโมงที่แล้ว`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return 'เมื่อวานนี้';
  if (diffDay < 7) return `${diffDay} วันที่แล้ว`;
  return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function AuditLog() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadLogs() {
    setLoading(true);
    setError('');
    try {
      const res = await api.admin.getAuditLogs();
      setLogs(Array.isArray(res.logs) ? res.logs : []);
    } catch (err: any) {
      setError(err.message || 'โหลดประวัติการดำเนินการไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Activity Log</p>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="h-4.5 w-4.5 text-indigo-500" />
            <span>ประวัติการดำเนินการ</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            บันทึกการอนุมัติ/ปฏิเสธ/ลบ ที่แอดมิน (และสมาชิกในบางกรณี) ทำในระบบ ล่าสุด 50 รายการ
          </p>
        </div>
        <button
          onClick={loadLogs}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-3.5 py-2 text-xs font-bold text-slate-600 border border-slate-200 shadow-xs hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <History className="h-3.5 w-3.5" />}
          รีเฟรช
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">{error}</div>
      )}

      <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">กำลังโหลด...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 border border-dashed border-slate-200 py-10 text-center">
            <History className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs text-slate-400">ยังไม่มีประวัติการดำเนินการ</p>
          </div>
        ) : (
          logs.map((log) => {
            const info = ACTION_INFO[log.action] || { ...DEFAULT_ACTION_INFO, label: log.action };
            const Icon = info.icon;
            const targetLabel = getTargetLabel(log);
            return (
              <div key={log.id} className="flex items-start gap-3 py-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl mt-0.5 ${info.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-800">
                    <span className="font-bold">{log.actor_name || 'ระบบ'}</span>{' '}
                    <span className="text-slate-500">{info.label}</span>
                    {targetLabel && <span className="font-semibold text-slate-700"> {targetLabel}</span>}
                  </p>
                  <span className="text-[11px] text-slate-400 mt-0.5 inline-block">{formatRelativeTimeTH(log.created_at)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
