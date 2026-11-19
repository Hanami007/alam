'use client';

import { useState } from 'react';
import { Flag, Loader2, X } from 'lucide-react';
import { FIELD_LIMITS } from '@/lib/field-limits';

export interface ReportTarget {
  targetType: 'post' | 'comment';
  targetId: number;
  preview: string;
}

const REASONS = [
  { value: 'inappropriate', label: 'ถ้อยคำไม่เหมาะสม' },
  { value: 'harassment', label: 'กลั่นแกล้ง / คุกคาม' },
  { value: 'spam', label: 'สแปม / โฆษณา' },
  { value: 'misinformation', label: 'ข้อมูลเท็จ' },
  { value: 'other', label: 'อื่นๆ' },
] as const;

/**
 * กล่องรายงานโพสต์/ความคิดเห็นที่หลุดตัวกรองคำ → POST /api/reports
 * ผู้เรียกควรใส่ key ตามเป้าหมาย (เช่น `${targetType}-${targetId}`) เพื่อล้างฟอร์มทุกครั้งที่เปิดใหม่
 */
export function ReportContentDialog({
  target,
  onClose,
  onDone,
}: {
  target: ReportTarget | null;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [reason, setReason] = useState<string>('inappropriate');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!target) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: target.targetType,
          targetId: target.targetId,
          reason,
          detail: detail.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'ส่งรายงานไม่สำเร็จ');
      onDone(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-dialog-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500 border border-rose-100">
              <Flag className="h-5 w-5" />
            </div>
            <div>
              <h2 id="report-dialog-title" className="text-base font-extrabold text-slate-900">
                รายงาน{target.targetType === 'post' ? 'โพสต์' : 'ความคิดเห็น'}
              </h2>
              <p className="text-xs text-slate-500">ผู้ดูแลระบบจะตรวจสอบและซ่อนหรือลบหากไม่เหมาะสม</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-600 line-clamp-3 break-words">
          {target.preview}
        </p>

        <fieldset className="space-y-1.5">
          <legend className="text-xs font-bold text-slate-700 mb-1">เหตุผล</legend>
          {REASONS.map((r) => (
            <label
              key={r.value}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm cursor-pointer ${
                reason === r.value ? 'border-rose-300 bg-rose-50/60 text-rose-800' : 'border-slate-200 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="report-reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className="accent-rose-500"
              />
              {r.label}
            </label>
          ))}
        </fieldset>

        <div className="space-y-1">
          <label htmlFor="report-detail" className="text-xs font-bold text-slate-700">
            รายละเอียดเพิ่มเติม (ไม่บังคับ)
          </label>
          <textarea
            id="report-detail"
            rows={2}
            maxLength={FIELD_LIMITS.reportDetail}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none resize-none"
          />
        </div>

        {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-rose-600 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            ส่งรายงาน
          </button>
        </div>
      </form>
    </div>
  );
}
