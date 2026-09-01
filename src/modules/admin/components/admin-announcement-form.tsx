'use client';

import { useState } from 'react';
import { Megaphone, Pin, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';

interface AdminAnnouncementFormProps {
  onSuccess?: () => void;
}

export function AdminAnnouncementForm({ onSuccess }: AdminAnnouncementFormProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('ประกาศทางการ');
  const [pinned, setPinned] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setStatusMessage({ type: 'error', text: 'กรุณากรอกหัวข้อประกาศ' });
      return;
    }

    try {
      setSubmitting(true);
      setStatusMessage(null);

      await api.admin.createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        category,
        pinned,
      });

      setStatusMessage({ type: 'success', text: 'สร้างประกาศและเผยแพร่ลงวอลล์หลักเรียบร้อยแล้ว!' });
      setTitle('');
      setBody('');

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error creating announcement:', err);
      setStatusMessage({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการสร้างประกาศ' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">สร้างประกาศทางการลงวอลล์ข่าวสาร</h3>
            <p className="text-xs text-slate-500">โพสต์ข่าวสาร กิจกรรมราตรี หรือข่าวสำคัญโดยตรงลงวอลล์หลักของระบบ</p>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            หัวข้อประกาศ *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น ขอเชิญร่วมงานราตรีศิษย์เก่า CS MJU ครั้งที่ 43..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-semibold"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              หมวดหมู่ประกาศ
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="ประกาศทางการ">📢 ประกาศทางการ</option>
              <option value="กิจกรรมศิษย์เก่า">🎉 กิจกรรมศิษย์เก่า</option>
              <option value="รับสมัครงาน">💼 ข่าวรับสมัครงาน</option>
              <option value="ทุนการศึกษา">🎓 ทุนการศึกษา & สิทธิประโยชน์</option>
            </select>
          </div>

          <div className="flex items-center pt-5">
            <label className="inline-flex items-center gap-2 cursor-pointer bg-amber-50/80 px-4 py-2.5 rounded-2xl border border-amber-200 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors w-full">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <Pin className="h-4 w-4 text-amber-600" />
              <span>ปักหมุดประกาศนี้ไว้บนสุดของวอลล์</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            รายละเอียดประกาศ
          </label>
          <textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="พิมพ์เนื้อหาข่าวสาร สถานที่ เวลา หรือรายละเอียดที่ต้องการประชาสัมพันธ์..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all leading-relaxed"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-indigo-700 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>กำลังเผยแพร่...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>เผยแพร่ลงวอลล์หลัก</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
