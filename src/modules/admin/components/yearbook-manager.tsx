'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  GraduationCap,
  Sparkles,
  Quote,
  X,
  RefreshCw,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { api } from '@/lib/api-client';

export interface YearbookEntry {
  id: number | string;
  studentId?: string;
  name: string;
  nickname: string;
  generation: string;
  avatarUrl: string;
  quote: string;
}

export function YearbookManager() {
  const [entries, setEntries] = useState<YearbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenFilter, setSelectedGenFilter] = useState('all');

  // Form Modal State (Add / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<YearbookEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    avatarUrl: '',
    generation: 'รุ่น 43',
    quote: '',
  });

  async function loadYearbookData() {
    setLoading(true);
    try {
      const data = await api.admin.getYearbookList();
      if (Array.isArray(data)) {
        setEntries(data);
      }
    } catch (err) {
      console.error('[YearbookManager] Error loading list:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadYearbookData();
  }, []);

  function handleOpenAdd() {
    setEditingEntry(null);
    setFormData({
      name: '',
      nickname: '',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
      generation: 'รุ่น 43',
      quote: '',
    });
    setStatusMessage(null);
    setIsFormOpen(true);
  }

  function handleOpenEdit(entry: YearbookEntry) {
    setEditingEntry(entry);
    setFormData({
      name: entry.name || '',
      nickname: entry.nickname || '',
      avatarUrl: entry.avatarUrl || '',
      generation: entry.generation || 'รุ่น 43',
      quote: entry.quote || '',
    });
    setStatusMessage(null);
    setIsFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      setStatusMessage({ type: 'error', text: 'กรุณากรอกชื่อ-นามสกุล' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      if (editingEntry) {
        // Update existing entry
        await api.admin.updateYearbookEntry({
          id: editingEntry.id,
          ...formData,
        });
        setStatusMessage({ type: 'success', text: 'อัปเดตข้อมูลหนังสือรุ่นสำเร็จ' });
      } else {
        // Create new entry
        await api.admin.addYearbookEntry(formData);
        setStatusMessage({ type: 'success', text: 'เพิ่มข้อมูลหนังสือรุ่นใหม่สำเร็จ' });
      }

      await loadYearbookData();
      setTimeout(() => {
        setIsFormOpen(false);
      }, 900);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number | string, name: string) {
    if (!confirm(`คุณต้องการลบข้อมูลหนังสือรุ่นของ "${name}" ใช่หรือไม่?`)) return;

    try {
      await api.admin.deleteYearbookEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  }

  const filteredEntries = entries.filter((item) => {
    if (selectedGenFilter !== 'all' && item.generation !== selectedGenFilter) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.name.toLowerCase().includes(q) ||
      item.nickname.toLowerCase().includes(q) ||
      item.quote.toLowerCase().includes(q) ||
      item.generation.toLowerCase().includes(q)
    );
  });

  return (
    <section className="rounded-[32px] border border-slate-200/90 bg-white p-6 shadow-sm space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-extrabold text-indigo-600 uppercase tracking-wider">
            <BookOpen className="h-4 w-4" />
            <span>Admin Data Management</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            ป้อนและจัดการข้อมูลหนังสือรุ่น (Yearbook Master)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            แอดมินสามารถเพิ่ม แก้ไข และลบข้อมูลศิษย์เก่าที่จะแสดงผลในหน้าหนังสือรุ่นได้ทั้งหมดที่นี่
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => loadYearbookData()}
            className="p-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-md hover:opacity-95 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>+ ป้อนข้อมูลศิษย์ใหม่</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/70">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาตามชื่อ, ชื่อเล่น, คำคม หรือรุ่น..."
            className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedGenFilter}
            onChange={(e) => setSelectedGenFilter(e.target.value)}
            className="h-10 px-3 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 focus:border-indigo-500 focus:outline-none cursor-pointer"
          >
            <option value="all">ทุกรุ่น ({entries.length})</option>
            {Array.from({ length: 48 }, (_, i) => `รุ่น ${i + 1}`).map((gen) => (
              <option key={gen} value={gen}>
                {gen}
              </option>
            ))}
          </select>

          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap px-2">
            {filteredEntries.length} รายการ
          </span>
        </div>
      </div>

      {/* Entries Table / List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 space-y-2">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-600" />
          <p>กำลังโหลดข้อมูลหนังสือรุ่น...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 space-y-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <BookOpen className="h-8 w-8 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-600">ยังไม่มีข้อมูลหนังสือรุ่น</p>
          <p>กดปุ่ม "+ ป้อนข้อมูลศิษย์ใหม่" เพื่อเริ่มสร้างข้อมูลหนังสือรุ่น</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">รูปภาพ</th>
                <th className="p-3.5">รุ่น</th>
                <th className="p-3.5">ชื่อ - นามสกุล (ชื่อเล่น)</th>
                <th className="p-3.5">คำคมประจำใจ (Senior Quote)</th>
                <th className="p-3.5 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredEntries.map((item) => (
                <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="p-3.5">
                    <img
                      src={item.avatarUrl || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=600&q=80'}
                      alt={item.name}
                      className="h-10 w-10 rounded-xl object-cover ring-2 ring-slate-100"
                    />
                  </td>
                  <td className="p-3.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-extrabold text-[11px] border border-indigo-100">
                      {item.generation || 'รุ่น 43'}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-900">
                    {item.name} {item.nickname ? `(${item.nickname})` : ''}
                  </td>
                  <td className="p-3.5 italic text-slate-600 max-w-xs truncate">
                    &ldquo;{item.quote || 'ยังไม่ได้ระบุคำคม'}&rdquo;
                  </td>
                  <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer"
                      title="แก้ไขข้อมูล"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                      title="ลบข้อมูล"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form (Add / Edit) */}
      {isFormOpen && (
        <div
          onClick={() => setIsFormOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-white p-6 shadow-2xl rounded-[32px] border border-slate-100 space-y-4 animate-scale-up"
          >
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                <span>{editingEntry ? 'แก้ไขข้อมูลศิษย์เก่าในหนังสือรุ่น' : 'ป้อนข้อมูลศิษย์เก่าใหม่ (หนังสือรุ่น)'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                กรอกข้อมูลที่ต้องการแสดงผลในการ์ดหนังสือรุ่น (รูปภาพ, ชื่อ, คำคม, รุ่น)
              </p>
            </div>

            {statusMessage && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-600" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* ชื่อ & ชื่อเล่น */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    ชื่อ - นามสกุล *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="เช่น ดร.ประสิทธิ์ ปัญญาดี"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    ชื่อเล่น
                  </label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    placeholder="เช่น สิทธิ์"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* เลือกรุ่น */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 text-indigo-600" /> เลือกรุ่น (Generation) *
                </label>
                <select
                  value={formData.generation}
                  onChange={(e) => setFormData({ ...formData, generation: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  {Array.from({ length: 48 }, (_, i) => `รุ่น ${i + 1}`).map((gen) => (
                    <option key={gen} value={gen}>
                      {gen}
                    </option>
                  ))}
                </select>
              </div>

              {/* รูปภาพประจำตัว */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5 text-indigo-600" /> รูปภาพประจำตัว (Upload Photo)
                </label>

                <div className="flex items-center gap-3">
                  {/* Preview Thumbnail */}
                  <div className="relative h-14 w-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    {formData.avatarUrl ? (
                      <img src={formData.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    {/* File Upload Input Button */}
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-50 text-indigo-700 text-xs font-extrabold border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer active:scale-95 shadow-2xs">
                      <Upload className="h-4 w-4" />
                      <span>อัปโหลดรูปภาพจากไฟล์...</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              if (evt.target?.result) {
                                setFormData({ ...formData, avatarUrl: evt.target.result as string });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* คำคมประจำใจ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                  <Quote className="h-3.5 w-3.5 text-amber-500" /> คำคมประจำใจ (Senior Quote)
                </label>
                <textarea
                  rows={3}
                  maxLength={180}
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  placeholder="พิมพ์คำคมเด็ดๆ ตลกๆ หรือคติประจำใจ..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <span>{editingEntry ? 'บันทึกการแก้ไข' : 'เพิ่มข้อมูลศิษย์เก่า'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
