'use client';

import { useState } from 'react';
import { api } from '@/lib/api-client';
import { Lock, Save, CheckCircle2, AlertCircle } from 'lucide-react';

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

/** เปลี่ยนรหัสผ่าน — ต้องยืนยันรหัสเดิม และกรอกรหัสใหม่ 2 ครั้งให้ตรงกัน */
export function ChangePasswordCard() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.next.length < 6) {
      setStatus('error');
      setMessage('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (form.next !== form.confirm) {
      setStatus('error');
      setMessage('รหัสผ่านใหม่และการยืนยันไม่ตรงกัน');
      return;
    }
    setStatus('saving');
    setMessage('');
    try {
      await api.user.changePassword(form.current, form.next);
      setForm({ current: '', next: '', confirm: '' });
      setStatus('success');
      setMessage('เปลี่ยนรหัสผ่านแล้ว อุปกรณ์อื่นที่ล็อกอินค้างไว้จะถูกออกจากระบบ');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100';

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">เปลี่ยนรหัสผ่าน</h3>
          <p className="text-xs text-slate-500">ต้องยืนยันรหัสผ่านปัจจุบันก่อนตั้งรหัสใหม่</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        {([
          ['current', 'รหัสผ่านปัจจุบัน', 'current-password'],
          ['next', 'รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)', 'new-password'],
          ['confirm', 'ยืนยันรหัสผ่านใหม่', 'new-password'],
        ] as const).map(([key, label, autoComplete]) => (
          <label key={key} className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
            <input
              type="password"
              required
              autoComplete={autoComplete}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className={inputClass}
            />
          </label>
        ))}

        {message && (
          <p className={`flex items-start gap-1.5 text-xs font-medium ${status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {status === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={status === 'saving'}
          className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {status === 'saving' ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
        </button>
      </form>
    </section>
  );
}
