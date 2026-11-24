'use client';

import { useCallback, useEffect, useState } from 'react';
import { Hand, Loader2, Search, Tag, X } from 'lucide-react';

/**
 * แท็กคนในรูป — อยู่ใต้รูปในหน้าต่างดูรูปใหญ่ของคลังภาพเก่า (พื้นเข้ม)
 * แท็กตัวเองขึ้นทันที แท็กเพื่อนต้องรอเจ้าตัวยอมรับ (ดู nas-tag.service)
 */

interface PhotoTag {
  id: number;
  userId: number;
  name: string;
  status: 'pending' | 'accepted';
  canRemove: boolean;
}

interface MemberResult {
  id: number;
  name: string;
  nickname: string | null;
  generation: string | null;
}

export function PhotoTagPanel({ path, currentUserId }: { path: string; currentUserId: number }) {
  const [tags, setTags] = useState<PhotoTag[]>([]);
  const [canTag, setCanTag] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MemberResult[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/gallery/photo-tags?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (res.ok) {
        setTags(data.tags || []);
        setCanTag(Boolean(data.canTag));
      }
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  // ค้นหาเพื่อนแบบหน่วงเวลา ไม่ยิง API ทุกตัวอักษร
  useEffect(() => {
    if (!searching || query.trim().length < 1) return;
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/gallery/photo-tags/members?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json().catch(() => []);
      setResults(Array.isArray(data) ? data : []);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, searching]);

  async function addTag(userId?: number) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/gallery/photo-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, userId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'แท็กไม่สำเร็จ');
      setMessage({
        type: 'success',
        text: data.status === 'pending' ? 'ส่งแท็กแล้ว รอเพื่อนกดยืนยันก่อนจึงจะแสดง' : 'แท็กตัวเองแล้ว รูปนี้อยู่ในอัลบั้มของคุณ',
      });
      setSearching(false);
      setQuery('');
      setResults([]);
      await load();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function removeTag(tag: PhotoTag) {
    setBusy(true);
    try {
      const res = await fetch(`/api/gallery/photo-tags?id=${tag.id}`, { method: 'DELETE' });
      if (res.ok) await load();
    } finally {
      setBusy(false);
    }
  }

  const iAmTagged = tags.some((t) => t.userId === currentUserId);

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3.5 text-white">
      <div className="flex flex-wrap items-center gap-2">
        <Tag className="h-4 w-4 text-indigo-300" />
        <span className="text-xs font-semibold text-slate-300">คนในรูป:</span>
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
        ) : tags.length === 0 ? (
          <span className="text-xs text-slate-400">ยังไม่มีใครถูกแท็ก</span>
        ) : (
          tags.map((t) => (
            <span
              key={t.id}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                t.status === 'accepted' ? 'bg-indigo-500/30 text-indigo-100' : 'border border-dashed border-amber-300/60 text-amber-200'
              }`}
            >
              {t.name}
              {t.status === 'pending' && <span className="font-normal opacity-80">(รอยืนยัน)</span>}
              {t.canRemove && (
                <button type="button" onClick={() => removeTag(t)} disabled={busy} title="ลบแท็ก" className="opacity-70 hover:opacity-100">
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))
        )}
      </div>

      {canTag && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {!iAmTagged && (
            <button
              type="button"
              disabled={busy}
              onClick={() => addTag()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-400 disabled:opacity-50"
            >
              <Hand className="h-3.5 w-3.5" /> นี่คือฉัน
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => setSearching((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-50"
          >
            <Tag className="h-3.5 w-3.5" /> แท็กเพื่อน
          </button>
        </div>
      )}

      {searching && (
        <div className="mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="พิมพ์ชื่อ ชื่อเล่น หรือรหัสนักศึกษาของเพื่อน"
              className="w-full rounded-xl border border-white/15 bg-slate-950/60 py-2 pl-8 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
            />
          </div>
          {query.trim() && (
            <ul className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/80">
              {results.filter((r) => r.id !== currentUserId).length === 0 ? (
                <li className="px-3 py-2.5 text-xs text-slate-400">ไม่พบสมาชิก</li>
              ) : (
                results
                  .filter((r) => r.id !== currentUserId)
                  .map((r) => {
                    const already = tags.some((t) => t.userId === r.id);
                    return (
                      <li key={r.id}>
                        <button
                          type="button"
                          disabled={busy || already}
                          onClick={() => addTag(r.id)}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-white/10 disabled:opacity-50"
                        >
                          <span className="truncate">
                            {r.name}
                            {r.nickname ? ` (${r.nickname})` : ''}
                          </span>
                          <span className="shrink-0 text-[11px] text-slate-400">{already ? 'แท็กแล้ว' : r.generation ?? ''}</span>
                        </button>
                      </li>
                    );
                  })
              )}
            </ul>
          )}
        </div>
      )}

      {message && (
        <p className={`mt-2 text-[11px] ${message.type === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>{message.text}</p>
      )}
    </div>
  );
}
