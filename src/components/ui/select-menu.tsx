'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown } from 'lucide-react';

export interface SelectMenuOption {
  value: string;
  label: string;
}

interface SelectMenuProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectMenuOption[];
  placeholder?: string;
  disabled?: boolean;
  title?: string;
  /** คลาสของช่องกด ให้แต่ละฟอร์มแต่งให้เข้ากับช่องอื่นของตัวเอง */
  triggerClassName?: string;
}

/** ดรอปดาวน์แทน <select> ของเบราว์เซอร์ (รายการเลือกของเบราว์เซอร์แต่งไม่ได้ เป็นกรอบเหลี่ยมและยาวล้นจอ) */
export function SelectMenu({
  value,
  onChange,
  options,
  placeholder = 'เลือก',
  disabled = false,
  title,
  triggerClassName = '',
}: SelectMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    rootRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        title={title}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-2 text-left cursor-pointer disabled:cursor-not-allowed ${triggerClassName}`}
      >
        <span className={`truncate ${selected ? '' : 'opacity-60'}`}>{selected?.label ?? placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-56 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl animate-fade-in"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm text-left transition-colors cursor-pointer ${
                  isSelected ? 'bg-indigo-50 font-bold text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {opt.label}
                {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
