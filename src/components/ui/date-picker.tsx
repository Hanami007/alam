'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const TH_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];
const TH_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const TH_WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const BE_OFFSET = 543;

/** 'YYYY-MM-DD' ↔ Date แบบเวลาท้องถิ่น (กัน timezone เลื่อนวันจาก new Date('YYYY-MM-DD') ที่เป็น UTC) */
function parseDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}
function toValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  /** คลาสของช่องกด ให้แต่ละหน้าแต่งให้เข้ากับฟอร์มของตัวเอง */
  triggerClassName?: string;
  placeholder?: string;
  minYear?: number;
  /** ไม่ให้เลือกวันที่หลังวันนี้ (เช่น วันเกิด) */
  disableFuture?: boolean;
  /** ช่องที่อยู่ชิดขวาของฟอร์มให้ปฏิทินชิดขวา จะได้ไม่ล้นขอบ */
  align?: 'left' | 'right';
}

export function DatePicker({
  value,
  onChange,
  triggerClassName = '',
  placeholder = 'เลือกวันที่',
  minYear = 1950,
  disableFuture = false,
  align = 'left',
}: DatePickerProps) {
  const selected = parseDate(value);
  const today = useMemo(() => new Date(), []);
  const maxYear = disableFuture ? today.getFullYear() : today.getFullYear() + 10;

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'days' | 'years' | 'months'>('days');
  const [viewYear, setViewYear] = useState((selected ?? today).getFullYear());
  const [viewMonth, setViewMonth] = useState((selected ?? today).getMonth());
  const [openUpward, setOpenUpward] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);

  const openPicker = () => {
    const base = selected ?? today;
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setView('days');
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom;
      setOpenUpward(below < 380 && rect.top > below);
    }
    setOpen(true);
  };

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
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (view === 'years') {
      yearListRef.current?.querySelector('[data-current="true"]')?.scrollIntoView({ block: 'center' });
    }
  }, [view]);

  const days = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const start = new Date(viewYear, viewMonth, 1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [viewYear, viewMonth]);

  const years = useMemo(
    () => Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i),
    [minYear, maxYear]
  );

  const isDisabled = (d: Date) => disableFuture && d > today && !sameDay(d, today);
  const canGoNext = !(disableFuture && viewYear === today.getFullYear() && viewMonth >= today.getMonth());
  const canGoPrev = !(viewYear === minYear && viewMonth === 0);

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const label = selected
    ? `${selected.getDate()} ${TH_MONTHS[selected.getMonth()]} ${selected.getFullYear() + BE_OFFSET}`
    : '';

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-2 text-left cursor-pointer ${triggerClassName}`}
      >
        <span className={label ? '' : 'opacity-60'}>{label || placeholder}</span>
        <CalendarDays className="h-4 w-4 shrink-0 opacity-60" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="เลือกวันที่"
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} z-40 w-[296px] rounded-2xl border border-slate-100 bg-white p-3 text-slate-800 shadow-xl animate-fade-in ${
            openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
        >
          {/* Header */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setView(view === 'days' ? 'years' : 'days')}
              className="flex items-center gap-1 rounded-xl px-2 py-1 text-sm font-bold text-slate-800 hover:bg-slate-50 cursor-pointer"
            >
              {view === 'days' ? `${TH_MONTHS[viewMonth]} ${viewYear + BE_OFFSET}` : `พ.ศ. ${viewYear + BE_OFFSET}`}
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${view !== 'days' ? 'rotate-180' : ''}`} />
            </button>
            {view === 'days' && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  disabled={!canGoPrev}
                  aria-label="เดือนก่อนหน้า"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  disabled={!canGoNext}
                  aria-label="เดือนถัดไป"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {view === 'days' && (
            <>
              <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400">
                {TH_WEEKDAYS.map((d) => (
                  <div key={d} className="py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-0.5 text-center">
                {days.map((d) => {
                  const inMonth = d.getMonth() === viewMonth;
                  const isSel = selected ? sameDay(d, selected) : false;
                  const isToday = sameDay(d, today);
                  const disabled = isDisabled(d);
                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        onChange(toValue(d));
                        setOpen(false);
                      }}
                      className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-25 ${
                        isSel
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-md'
                          : isToday
                          ? 'text-indigo-600 ring-1 ring-indigo-300 hover:bg-indigo-50'
                          : inMonth
                          ? 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600'
                          : 'text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {view === 'years' && (
            <div ref={yearListRef} className="grid max-h-64 grid-cols-4 gap-1 overflow-y-auto pr-1">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  data-current={y === viewYear}
                  onClick={() => {
                    setViewYear(y);
                    setView('months');
                  }}
                  className={`rounded-xl py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    y === viewYear ? 'bg-indigo-500 text-white' : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
                >
                  {y + BE_OFFSET}
                </button>
              ))}
            </div>
          )}

          {view === 'months' && (
            <div className="grid grid-cols-3 gap-1.5">
              {TH_MONTHS_SHORT.map((m, i) => {
                const disabled = disableFuture && viewYear === today.getFullYear() && i > today.getMonth();
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setViewMonth(i);
                      setView('days');
                    }}
                    className={`rounded-xl py-2.5 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-25 ${
                      i === viewMonth ? 'bg-indigo-500 text-white' : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          )}

          {value && (
            <div className="mt-2 flex justify-end border-t border-slate-100 pt-2">
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setOpen(false);
                }}
                className="rounded-full px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-500 cursor-pointer"
              >
                ล้างค่า
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
