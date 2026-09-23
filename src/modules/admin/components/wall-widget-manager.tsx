'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '@/lib/api-client';

interface WallFortune {
  id: number;
  message: string;
}

export function WallWidgetManager() {
  const [loading, setLoading] = useState(true);
  const [fortunes, setFortunes] = useState<WallFortune[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [fortuneMessage, setFortuneMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.admin.getWallWidgets();
        if (cancelled) return;
        setFortunes(res.fortunes || []);
      } catch (err) {
        if (!cancelled) console.error('[WallWidgetManager] load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function flashSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 2500);
  }

  async function handleAddFortune() {
    const message = fortuneMessage.trim();
    if (!message) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await api.admin.addWallFortune(message);
      setFortunes((prev) => [res.data, ...prev]);
      setFortuneMessage('');
      flashSuccess('เพิ่มข้อความเซียมซีสำเร็จ');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id: number) {
    setRemovingId(id);
    setError('');
    try {
      await api.admin.removeWallFortune(id);
      setFortunes((prev) => prev.filter((f) => f.id !== id));
      flashSuccess('ลบรายการสำเร็จ');
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถลบได้');
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-xs space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-purple-500">Feed Sidebar Widgets</p>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-purple-500" />
          จัดการข้อความเซียมซีศิษย์เก่า
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          จัดการข้อความที่สุ่มแสดงในวิดเจ็ต &ldquo;เซียมซีศิษย์เก่าประจำวัน&rdquo; หน้าฟีด — ส่วนวิดเจ็ต
          &ldquo;สุขสันต์วันเกิด&rdquo; ดึงจากวันเกิดจริงของสมาชิก และ &ldquo;อันดับกิจกรรม&rdquo; ดึงจาก Top 3
          ศิษย์เก่าดีเด่น (Hall of Fame) จริง จึงไม่ต้องจัดการที่นี่
        </p>
      </div>

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

      {loading ? (
        <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">กำลังโหลด...</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={fortuneMessage}
              onChange={(e) => setFortuneMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !submitting && handleAddFortune()}
              placeholder="พิมพ์ข้อความเซียมซีใหม่ เช่น 🔮 สัปดาห์นี้จะมีข่าวดี..."
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all"
              disabled={submitting}
            />
            <button
              onClick={handleAddFortune}
              disabled={submitting || !fortuneMessage.trim()}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              เพิ่ม
            </button>
          </div>

          <div className="space-y-2">
            {fortunes.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">
                ยังไม่มีข้อความเซียมซี
              </p>
            ) : (
              fortunes.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-purple-100 bg-purple-50/40 px-4 py-2.5"
                >
                  <p className="text-xs font-semibold text-purple-900">{f.message}</p>
                  <button
                    onClick={() => handleRemove(f.id)}
                    disabled={removingId === f.id}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-purple-400 hover:bg-purple-100 hover:text-purple-700 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    {removingId === f.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}
