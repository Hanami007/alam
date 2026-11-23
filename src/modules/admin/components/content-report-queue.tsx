'use client';

import { useCallback, useEffect, useState } from 'react';
import { EyeOff, Eye, Flag, Loader2, RefreshCw, Trash2, XCircle, MessageSquare, FileText } from 'lucide-react';

interface ReportReasonEntry {
  reason: string;
  detail: string | null;
  reporterName: string;
  createdAt: string;
}

interface ReportQueueItem {
  targetType: 'post' | 'comment';
  targetId: number;
  postId: number | null;
  preview: string;
  authorName: string | null;
  isHidden: boolean;
  reportCount: number;
  reasons: ReportReasonEntry[];
  firstReportedAt: string;
  status: string;
}

const REASON_LABELS: Record<string, string> = {
  inappropriate: 'ถ้อยคำไม่เหมาะสม',
  spam: 'สแปม / โฆษณา',
  harassment: 'กลั่นแกล้ง / คุกคาม',
  misinformation: 'ข้อมูลเท็จ',
  other: 'อื่นๆ',
};

const STATUS_LABELS: Record<string, string> = {
  hidden: 'ซ่อนแล้ว',
  deleted: 'ลบแล้ว',
  dismissed: 'ยกเลิกรายงาน',
};

type Action = 'hide' | 'unhide' | 'delete' | 'dismiss';

async function fetchReportQueue(view: 'pending' | 'resolved') {
  const res = await fetch(`/api/admin/reports?status=${view}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'โหลดรายงานไม่สำเร็จ');
  return data as { items: ReportQueueItem[]; pendingCount: number };
}

/** คิวรายงานเนื้อหา — แอดมินซ่อน / ลบ / ยกเลิกรายงาน เนื้อหาที่ผู้ใช้รายงานว่าหลุดตัวกรองคำ */
export function ContentReportQueue({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const [view, setView] = useState<'pending' | 'resolved'>('pending');
  const [items, setItems] = useState<ReportQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);

  // setState ทั้งหมดอยู่ใน callback ของ promise — เรียกจาก effect ได้โดยไม่ render ซ้อน
  const load = useCallback(
    () =>
      fetchReportQueue(view)
        .then((data) => {
          setItems(data.items || []);
          setError(null);
          onCountChange?.(data.pendingCount ?? 0);
        })
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false)),
    [view, onCountChange]
  );

  useEffect(() => {
    load();
  }, [load]);

  function reload(nextView = view) {
    setLoading(true);
    if (nextView !== view) setView(nextView);
    else load();
  }

  async function act(item: ReportQueueItem, action: Action) {
    const key = `${item.targetType}-${item.targetId}`;
    // ลบถาวรต้องกดยืนยันซ้ำ (ซ่อนย้อนคืนได้ จึงกดครั้งเดียว)
    if (action === 'delete' && confirmDeleteKey !== key) {
      setConfirmDeleteKey(key);
      return;
    }
    setConfirmDeleteKey(null);
    setBusyKey(key);
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType: item.targetType, targetId: item.targetId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ดำเนินการไม่สำเร็จ');
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">Content Reports</p>
          <h2 className="text-lg font-bold text-slate-900">คิวรายงานเนื้อหาไม่เหมาะสม</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            เนื้อหาที่หลุดตัวกรองคำแล้วถูกสมาชิกกดรายงาน — ซ่อน (ย้อนคืนได้) หรือลบถาวร
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-50">
            {(['pending', 'resolved'] as const).map((v) => (
              <button
                key={v}
                onClick={() => reload(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                {v === 'pending' ? 'รอตรวจสอบ' : 'ดำเนินการแล้ว'}
              </button>
            ))}
          </div>
          <button
            onClick={() => reload()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> รีเฟรช
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
          {view === 'pending' ? 'ไม่มีรายงานที่รอตรวจสอบ' : 'ยังไม่มีประวัติการดำเนินการ'}
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const key = `${item.targetType}-${item.targetId}`;
            const busy = busyKey === key;
            const TypeIcon = item.targetType === 'post' ? FileText : MessageSquare;
            return (
              <li key={key} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                    <TypeIcon className="h-3.5 w-3.5" />
                    {item.targetType === 'post' ? 'โพสต์' : 'ความคิดเห็น'} #{item.targetId}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-0.5 font-bold text-rose-600">
                    <Flag className="h-3.5 w-3.5" /> {item.reportCount} รายงาน
                  </span>
                  {item.isHidden && (
                    <span className="rounded-lg bg-amber-50 px-2 py-0.5 font-bold text-amber-700">ซ่อนอยู่</span>
                  )}
                  {view === 'resolved' && (
                    <span className="rounded-lg bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  )}
                  <span className="text-slate-400">โดย {item.authorName ?? 'ไม่ทราบ'}</span>
                </div>

                <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-800 whitespace-pre-wrap break-words line-clamp-4">
                  {item.preview}
                </p>

                <ul className="space-y-1 text-xs text-slate-600">
                  {item.reasons.map((r, i) => (
                    <li key={i}>
                      <span className="font-bold text-slate-800">{REASON_LABELS[r.reason] ?? r.reason}</span>
                      {r.detail ? ` — ${r.detail}` : ''}
                      <span className="text-slate-400"> · {r.reporterName}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center gap-2">
                  {view === 'pending' && (
                    <>
                      <button
                        disabled={busy}
                        onClick={() => act(item, 'hide')}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50 cursor-pointer"
                      >
                        <EyeOff className="h-3.5 w-3.5" /> ซ่อนจากฟีด
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => act(item, 'delete')}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {confirmDeleteKey === key ? 'กดอีกครั้งเพื่อยืนยันลบถาวร' : 'ลบถาวร'}
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => act(item, 'dismiss')}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                      >
                        <XCircle className="h-3.5 w-3.5" /> ไม่ผิด (ยกเลิกรายงาน)
                      </button>
                    </>
                  )}
                  {view === 'resolved' && item.isHidden && (
                    <button
                      disabled={busy}
                      onClick={() => act(item, 'unhide')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" /> เลิกซ่อน
                    </button>
                  )}
                  {busy && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
