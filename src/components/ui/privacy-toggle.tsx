'use client';

import { Eye, EyeOff } from 'lucide-react';

/**
 * ไอคอนเปิด/ปิดการแสดงข้อมูลส่วนตัวรายฟิลด์
 * เขียว (Eye) = สมาชิกคนอื่นเห็นได้, แดง (EyeOff) = เห็นเฉพาะตัวเองและผู้ดูแลระบบ
 */
export function PrivacyToggle({
  visible,
  onChange,
  fieldLabel,
  disabled,
  size = 'sm',
}: {
  visible: boolean;
  onChange: (next: boolean) => void;
  fieldLabel: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}) {
  const Icon = visible ? Eye : EyeOff;
  const text = visible ? 'แสดง' : 'ซ่อน';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={visible}
      aria-label={`${fieldLabel}: ${visible ? 'แสดงต่อสมาชิกคนอื่น' : 'ซ่อนจากสมาชิกคนอื่น'}`}
      title={
        visible
          ? `สมาชิกคนอื่นเห็น${fieldLabel}ของคุณ — กดเพื่อซ่อน`
          : `ซ่อน${fieldLabel}จากสมาชิกคนอื่น — กดเพื่อแสดง`
      }
      disabled={disabled}
      onClick={() => onChange(!visible)}
      className={`inline-flex items-center gap-1 rounded-full border font-bold transition-colors cursor-pointer disabled:opacity-50 ${
        size === 'md' ? 'px-3 py-1.5 text-xs' : 'px-2 py-0.5 text-[10px]'
      } ${
        visible
          ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25'
          : 'border-rose-400/50 bg-rose-500/15 text-rose-500 hover:bg-rose-500/25'
      }`}
    >
      <Icon className={size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3'} />
      {text}
    </button>
  );
}
