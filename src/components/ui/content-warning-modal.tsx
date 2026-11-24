'use client';

import { useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { ModalPortal } from '@/components/ui/modal-portal';

export interface ContentWarning {
  message: string;
  bannedWords?: string[];
}

/**
 * pop-up กลางจอเมื่อข้อความมีคำไม่เหมาะสม (API ตอบ code: 'BANNED_WORDS')
 * ใช้ร่วมกันทั้งโพสต์ โพล ความคิดเห็น และประกาศ — เดิมแสดงเป็น toast มุมจอ หายเองใน 3 วินาที
 */
export function ContentWarningModal({ warning, onClose }: { warning: ContentWarning | null; onClose: () => void }) {
  useEffect(() => {
    if (!warning) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [warning, onClose]);

  if (!warning) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in"
        onClick={onClose}
        role="presentation"
      >
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="content-warning-title"
          aria-describedby="content-warning-desc"
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl space-y-4"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 border border-rose-100">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h2 id="content-warning-title" className="text-base font-extrabold text-slate-900">
              พบคำที่ไม่เหมาะสม
            </h2>
            <p id="content-warning-desc" className="text-sm text-slate-600 leading-relaxed">
              {warning.message}
            </p>
          </div>
          {warning.bannedWords && warning.bannedWords.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {warning.bannedWords.map((w) => (
                <span
                  key={w}
                  className="rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-bold text-rose-700"
                >
                  {w}
                </span>
              ))}
            </div>
          )}
          <button
            autoFocus
            onClick={onClose}
            className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 cursor-pointer"
          >
            กลับไปแก้ไข
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}

/** แปลง response ของ API เป็น ContentWarning ถ้าเป็น error คำต้องห้าม ไม่ใช่คืน null */
export function toContentWarning(data: any): ContentWarning | null {
  if (data?.code !== 'BANNED_WORDS') return null;
  return { message: data.error, bannedWords: data.bannedWords };
}
