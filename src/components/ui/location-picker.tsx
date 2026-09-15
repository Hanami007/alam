'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { MapPin, Globe, Search, ChevronDown, Check, X } from 'lucide-react';

export interface LocationOption {
  id: number;
  code?: string;
  label: string;
  region?: string;
  metro?: boolean;
  is_international?: boolean;
  country_code?: string;
  flag?: string;
}

interface LocationPickerProps {
  value: string;
  onChange: (val: string) => void;
  options: LocationOption[];
  disabled?: boolean;
  accentColor?: 'indigo' | 'amber';
  placeholder?: string;
}

export function LocationPicker({
  value,
  onChange,
  options = [],
  disabled = false,
  accentColor = 'indigo',
  placeholder = 'เลือกจังหวัด หรือ ประเทศที่ทำงาน/ภูมิลำเนา',
}: LocationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'thailand' | 'international'>('thailand');
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  // Selected Option Object
  const selectedOption = useMemo(() => {
    return options.find((opt) => String(opt.id) === String(value));
  }, [options, value]);

  // Adjust default active tab based on selected value
  useEffect(() => {
    if (selectedOption?.is_international || selectedOption?.region === 'ต่างประเทศ') {
      setActiveTab('international');
    }
  }, [selectedOption]);

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Separate Thai vs International options
  const { thaiOptions, intlOptions } = useMemo(() => {
    const thai: LocationOption[] = [];
    const intl: LocationOption[] = [];

    for (const opt of options) {
      const isIntl =
        opt.is_international ||
        opt.region === 'ต่างประเทศ' ||
        (opt.country_code && opt.country_code !== 'TH') ||
        opt.label.includes('Japan') ||
        opt.label.includes('USA') ||
        opt.label.includes('Singapore') ||
        opt.label.includes('Australia') ||
        opt.label.includes('UK');

      if (isIntl) {
        intl.push(opt);
      } else {
        thai.push(opt);
      }
    }
    return { thaiOptions: thai, intlOptions: intl };
  }, [options]);

  // Filter items according to search and active tab
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const source = activeTab === 'thailand' ? thaiOptions : intlOptions;

    return source.filter((opt) => {
      // Region filter for Thailand
      if (activeTab === 'thailand' && regionFilter !== 'all') {
        if (regionFilter === 'metro' && !opt.metro) return false;
        if (regionFilter !== 'metro' && opt.region !== regionFilter) return false;
      }

      if (!q) return true;
      const matchLabel = opt.label.toLowerCase().includes(q);
      const matchRegion = (opt.region || '').toLowerCase().includes(q);
      const matchCode = (opt.code || '').toLowerCase().includes(q);
      return matchLabel || matchRegion || matchCode;
    });
  }, [activeTab, thaiOptions, intlOptions, searchQuery, regionFilter]);

  const ringColor =
    accentColor === 'amber'
      ? 'focus:ring-amber-500/30 border-amber-500/40 text-amber-300'
      : 'focus:ring-indigo-500/30 border-indigo-500/40 text-indigo-300';

  const activeTabBg =
    accentColor === 'amber'
      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
      : 'bg-indigo-600 text-white font-black shadow-md';

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-2xl border bg-slate-950/70 px-4 py-2.5 text-sm transition-all cursor-pointer select-none text-left ${
          isOpen
            ? accentColor === 'amber'
              ? 'border-amber-400 ring-4 ring-amber-500/20 shadow-lg shadow-amber-500/10'
              : 'border-indigo-500 ring-4 ring-indigo-500/20 shadow-lg shadow-indigo-500/10'
            : 'border-white/10 hover:border-white/20 hover:bg-slate-950/90'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          {selectedOption ? (
            <>
              <span className="text-base shrink-0">
                {selectedOption.flag || (selectedOption.is_international ? '🌐' : '📍')}
              </span>
              <div className="truncate">
                <span className="font-bold text-white text-sm">
                  {selectedOption.label}
                </span>
                <span className="ml-2 text-xs text-slate-400 font-medium">
                  {selectedOption.is_international
                    ? '(ต่างประเทศ / International)'
                    : `(ภาค${selectedOption.region || 'ไทย'})`}
                </span>
              </div>
            </>
          ) : (
            <span className="text-slate-500 text-xs sm:text-sm">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown (Strictly constrained within bounds, max-h-72, scrolling smoothly) */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-white/15 bg-slate-900/95 backdrop-blur-2xl shadow-2xl shadow-black/80 overflow-hidden animate-slide-up flex flex-col">
          {/* Header Tabs: Thailand vs International */}
          <div className="p-2 border-b border-white/10 bg-slate-950/60">
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('thailand');
                  setRegionFilter('all');
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs transition-all cursor-pointer ${
                  activeTab === 'thailand'
                    ? activeTabBg
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>🇹🇭</span>
                <span className="font-bold">ประเทศไทย ({thaiOptions.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('international');
                  setRegionFilter('all');
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs transition-all cursor-pointer ${
                  activeTab === 'international'
                    ? activeTabBg
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>🌐</span>
                <span className="font-bold">ต่างประเทศ ({intlOptions.length})</span>
              </button>
            </div>

            {/* Region Sub-Filter for Thailand */}
            {activeTab === 'thailand' && (
              <div className="flex items-center gap-1 overflow-x-auto pt-2 pb-0.5 scrollbar-none text-[11px]">
                {[
                  { id: 'all', label: 'ทั้งหมด' },
                  { id: 'เหนือ', label: 'เหนือ' },
                  { id: 'กลาง', label: 'กลาง' },
                  { id: 'อีสาน', label: 'อีสาน' },
                  { id: 'ใต้', label: 'ใต้' },
                  { id: 'ตะวันออก', label: 'ต.อ.' },
                  { id: 'ตะวันตก', label: 'ต.ต.' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRegionFilter(r.id)}
                    className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                      regionFilter === r.id
                        ? 'bg-white/20 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className="p-2 border-b border-white/5 relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-4.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'thailand'
                  ? 'พิมพ์ชื่อจังหวัด เช่น เชียงใหม่, กทม...'
                  : 'พิมพ์ชื่อประเทศ เช่น ญี่ปุ่น, สหรัฐอเมริกา, Japan...'
              }
              className="w-full rounded-xl bg-slate-950/80 border border-white/10 pl-8 pr-7 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* List of Options (Scrollable, confined to max-h-56) */}
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 divide-y divide-white/5">
            {filteredList.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                ไม่พบผลการค้นหาสำหรับ &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredList.map((opt) => {
                const isSelected = String(opt.id) === String(value);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(String(opt.id));
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer text-xs ${
                      isSelected
                        ? accentColor === 'amber'
                          ? 'bg-amber-500/20 text-amber-200 font-bold'
                          : 'bg-indigo-500/20 text-indigo-200 font-bold'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="shrink-0 text-sm">
                        {opt.flag || (opt.is_international ? '🌐' : '📍')}
                      </span>
                      <span className="truncate">{opt.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.region && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                          {opt.region}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Bottom Hint */}
          <div className="p-2 border-t border-white/10 bg-slate-950/80 text-[10px] text-slate-400 flex items-center justify-between">
            <span>
              {activeTab === 'international'
                ? '🌍 หมุดจะไปปรากฏบนแผนที่โลก 3D (CSMJU Global)'
                : '🇹🇭 หมุดจะปรากฏบนแผนที่ประเทศไทยและแผนที่โลก'}
            </span>
            <span className="text-slate-500 font-mono">
              {filteredList.length} รายการ
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
