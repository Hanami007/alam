'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Search, ShieldBan, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api-client';

interface BannedKeyword {
  id: number;
  keyword: string;
  added_by_name: string | null;
  created_at: string;
}

export function KeywordFilterManager() {
  const [keywords, setKeywords] = useState<BannedKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function loadKeywords() {
    try {
      const res = await api.admin.getKeywords();
      setKeywords(res.keywords || []);
    } catch (err) {
      console.error('Failed to load keywords', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKeywords();
  }, []);

  async function handleAdd() {
    const kw = inputValue.trim();
    if (!kw) return;
    setError('');
    setSuccess('');
    setAdding(true);
    try {
      await api.admin.addKeyword(kw);
      setInputValue('');
      setSuccess(`เพิ่มคำ "${kw}" สำเร็จ`);
      await loadKeywords();
      inputRef.current?.focus();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setAdding(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  }

  async function handleRemove(id: number, kw: string) {
    setRemovingId(id);
    try {
      await api.admin.removeKeyword(id);
      setKeywords((prev) => prev.filter((k) => k.id !== id));
      setSuccess(`ลบคำ "${kw}" สำเร็จ`);
      setTimeout(() => setSuccess(''), 2500);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถลบได้');
    } finally {
      setRemovingId(null);
    }
  }

  const filtered = searchQuery
    ? keywords.filter((k) => k.keyword.includes(searchQuery.toLowerCase()))
    : keywords;

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">Content Moderation</p>
          <h2 className="text-lg font-bold text-slate-900">ตัวกรองคำไม่เหมาะสม</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            คำที่อยู่ในรายการนี้จะถูกบล็อกอัตโนมัติเมื่อผู้ใช้พยายามสร้างโพสต์หรือโพล
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-2 border border-rose-100">
          <ShieldBan className="h-4 w-4 text-rose-500" />
          <span className="text-sm font-bold text-rose-700">{keywords.length} คำ</span>
        </div>
      </div>

      {/* Add keyword input */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700">เพิ่มคำต้องห้ามใหม่</label>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && !adding && handleAdd()}
            placeholder="พิมพ์คำที่ต้องการบล็อก แล้วกด Enter หรือปุ่ม +"
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
            disabled={adding}
          />
          <button
            onClick={handleAdd}
            disabled={adding || !inputValue.trim()}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            เพิ่ม
          </button>
        </div>

        {/* Error / success feedback */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700 font-medium">
            ✓ {success}
          </div>
        )}
      </div>

      {/* Search */}
      {keywords.length > 5 && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาคำในรายการ..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
          />
        </div>
      )}

      {/* Keywords list */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">กำลังโหลด...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 border border-dashed border-slate-200 py-8 text-center">
            <ShieldBan className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs text-slate-400">
              {searchQuery ? 'ไม่พบคำที่ค้นหา' : 'ยังไม่มีคำต้องห้ามในรายการ'}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filtered.map((kw) => (
              <div
                key={kw.id}
                className="group flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 pl-3.5 pr-1.5 py-1 text-sm font-semibold text-rose-800 transition-all hover:border-rose-300 hover:bg-rose-100"
              >
                <span>{kw.keyword}</span>
                <button
                  onClick={() => handleRemove(kw.id, kw.keyword)}
                  disabled={removingId === kw.id}
                  title="ลบคำนี้"
                  className="flex h-5 w-5 items-center justify-center rounded-full text-rose-400 hover:bg-rose-200 hover:text-rose-700 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  {removingId === kw.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer note */}
      <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 pt-4">
        💡 การตรวจสอบจะทำแบบ case-insensitive และตรวจทั้งหัวข้อ เนื้อหา คำถามโพล และตัวเลือกโพล
        โพสต์ที่ผ่านการตรวจจะถูกเผยแพร่ทันทีโดยไม่ต้องรออนุมัติ
      </p>
    </section>
  );
}
