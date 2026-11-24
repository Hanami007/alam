'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, Loader2, Plus, Save, X } from 'lucide-react';

/**
 * ตั้งคำถามปลดล็อกคลังภาพของรุ่น (/api/generation/unlock-question)
 * - หัวหน้ารุ่น: รุ่นของตัวเอง
 * - แอดมิน: เลือกรุ่นได้ (generations)
 * คำตอบที่ยอมรับใส่ได้หลายแบบ ระบบตรวจแบบไม่สนช่องว่าง ตัวพิมพ์ และจุด
 */
export function UnlockQuestionEditor({
  isAdmin,
  leaderGeneration,
  generations = [],
}: {
  isAdmin: boolean;
  leaderGeneration: { id: number; label: string } | null;
  generations?: { id: number; label: string }[];
}) {
  const [generationId, setGenerationId] = useState<number | null>(leaderGeneration?.id ?? null);
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<string[]>(['']);
  const [hasSaved, setHasSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async (genId: number | null) => {
    if (!genId && isAdmin) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/generation/unlock-question${isAdmin && genId ? `?generationId=${genId}` : ''}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'โหลดคำถามไม่สำเร็จ');
      setQuestion(data.question?.question ?? '');
      setAnswers(data.question?.acceptedAnswers?.length ? data.question.acceptedAnswers : ['']);
      setHasSaved(Boolean(data.question));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- โหลดคำถามของรุ่นที่เลือก
    load(generationId);
  }, [generationId, load]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/generation/unlock-question', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId: isAdmin ? generationId : undefined, question, answers }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'บันทึกไม่สำเร็จ');
      setHasSaved(true);
      setMessage({ type: 'success', text: 'บันทึกคำถามแล้ว สมาชิกจะเห็นคำถามนี้ตอนปลดล็อกคลังภาพของรุ่น' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100';

  return (
    <div className="rounded-[32px] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-5">
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">คำถามปลดล็อกคลังภาพเก่า</h2>
          <p className="text-xs text-slate-500">
            สมาชิกต้องตอบถูกก่อนดูภาพของรุ่น{leaderGeneration && !isAdmin ? ` (${leaderGeneration.label})` : ''} — ตั้งคำถามที่คนในรุ่นเท่านั้นตอบได้
          </p>
        </div>
      </div>

      {isAdmin && (
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">รุ่น</span>
          <select
            value={generationId ?? ''}
            onChange={(e) => setGenerationId(e.target.value ? Number(e.target.value) : null)}
            className={inputClass}
          >
            <option value="">เลือกรุ่น</option>
            {generations.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>
        </label>
      )}

      {isAdmin && !generationId ? (
        <p className="rounded-2xl bg-slate-50 py-6 text-center text-xs text-slate-400">เลือกรุ่นเพื่อดูหรือตั้งคำถาม</p>
      ) : loading ? (
        <p className="flex items-center justify-center gap-2 py-6 text-xs text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลด...
        </p>
      ) : (
        <div className="space-y-4">
          {!hasSaved && (
            <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800 border border-amber-100">
              ⚠️ รุ่นนี้ยังไม่มีคำถาม — ตอนนี้ใครก็ปลดล็อกคลังภาพของรุ่นได้โดยไม่ต้องตอบ
            </p>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">คำถาม</span>
            <input
              type="text"
              maxLength={200}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="เช่น อาจารย์ที่ปรึกษาของรุ่นเราชื่ออะไร?"
              className={inputClass}
            />
          </label>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              คำตอบที่ถูกต้อง <span className="font-normal text-slate-400">(ใส่ได้หลายแบบ ระบบไม่สนช่องว่าง ตัวพิมพ์เล็ก-ใหญ่ และจุด)</span>
            </span>
            <div className="space-y-2">
              {answers.map((answer, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    maxLength={100}
                    value={answer}
                    onChange={(e) => setAnswers((prev) => prev.map((a, j) => (j === i ? e.target.value : a)))}
                    placeholder={i === 0 ? 'เช่น อ.สมชาย' : 'คำตอบแบบอื่น เช่น สมชาย'}
                    className={inputClass}
                  />
                  {answers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setAnswers((prev) => prev.filter((_, j) => j !== i))}
                      className="shrink-0 rounded-xl border border-slate-200 px-3 text-slate-400 hover:bg-slate-50 hover:text-rose-500"
                      title="ลบคำตอบนี้"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {answers.length < 10 && (
              <button
                type="button"
                onClick={() => setAnswers((prev) => [...prev, ''])}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <Plus className="h-3.5 w-3.5" /> เพิ่มคำตอบแบบอื่น
              </button>
            )}
          </div>

          {message && (
            <p className={`flex items-start gap-1.5 text-xs font-medium ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {message.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0" />}
              {message.text}
            </p>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            บันทึกคำถาม
          </button>
        </div>
      )}
    </div>
  );
}
