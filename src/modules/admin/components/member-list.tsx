'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Users,
  X,
  Mail,
  GraduationCap,
  MapPin,
  Briefcase,
  Building2,
  Star,
  CalendarDays,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

export interface AdminMember {
  id: number;
  studentId: string | null;
  name: string;
  email: string;
  role: string;
  status: string;
  studentStatus: string | null;
  generation: string | null;
  province: string | null;
  careerType: string | null;
  company: string | null;
  position: string | null;
  avatarUrl: string | null;
  totalPoints: number;
  createdAt: string;
}

interface MemberListProps {
  members: AdminMember[];
  onDelete?: (userId: number) => Promise<void> | void;
}

type StatusFilter = 'all' | 'approved' | 'pending' | 'rejected';
type RoleFilter = 'all' | 'admin' | 'alumni';

const STATUS_STYLE: Record<string, string> = {
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

const STATUS_LABEL: Record<string, string> = {
  approved: 'อนุมัติแล้ว',
  pending: 'รออนุมัติ',
  rejected: 'ปฏิเสธแล้ว',
};

export function MemberList({ members, onDelete }: MemberListProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [selectedMember, setSelectedMember] = useState<AdminMember | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  function closeModal() {
    setSelectedMember(null);
    setConfirmingDelete(false);
    setDeleteError('');
  }

  async function handleConfirmDelete() {
    if (!selectedMember || !onDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await onDelete(selectedMember.id);
      setSelectedMember(null);
      setConfirmingDelete(false);
    } catch (err: any) {
      setDeleteError(err?.message || 'เกิดข้อผิดพลาดในการลบสมาชิก');
    } finally {
      setDeleting(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (roleFilter !== 'all' && m.role !== roleFilter) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        (m.studentId || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q)
      );
    });
  }, [members, query, statusFilter, roleFilter]);

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">สมาชิกทั้งหมด</p>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-indigo-500" />
            <span>รายชื่อสมาชิกในระบบ</span>
          </h2>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600 border border-indigo-100">
          {filtered.length} / {members.length} คน
        </span>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อ, รหัสนักศึกษา หรืออีเมล..."
            className="w-full h-10 rounded-2xl border border-slate-200 bg-slate-50/70 pl-9 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-indigo-400 focus:outline-none cursor-pointer"
        >
          <option value="all">ทุกสถานะ</option>
          <option value="approved">อนุมัติแล้ว</option>
          <option value="pending">รออนุมัติ</option>
          <option value="rejected">ปฏิเสธแล้ว</option>
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-indigo-400 focus:outline-none cursor-pointer"
        >
          <option value="all">ทุกบทบาท</option>
          <option value="alumni">ศิษย์เก่า</option>
          <option value="admin">แอดมิน</option>
        </select>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-2xl border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-slate-50/90 border-b border-slate-200/70 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
          <div className="col-span-4">สมาชิก</div>
          <div className="col-span-2">รุ่น</div>
          <div className="col-span-2">บทบาท</div>
          <div className="col-span-2">สถานะ</div>
          <div className="col-span-2 text-right pr-2">แต้มสะสม</div>
        </div>
        <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-xs text-slate-400">ไม่พบสมาชิกที่ตรงกับเงื่อนไข</p>
          ) : (
            filtered.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedMember(m)}
                className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-slate-50/60 transition-colors cursor-pointer"
              >
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  {m.avatarUrl ? (
                    <img
                      src={m.avatarUrl}
                      alt={m.name}
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {m.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{m.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {m.studentId || 'ไม่ระบุรหัส'} · {m.email}
                    </p>
                  </div>
                </div>
                <div className="col-span-2 text-xs text-slate-600 truncate">{m.generation || '-'}</div>
                <div className="col-span-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                      m.role === 'admin'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {m.role === 'admin' ? 'แอดมิน' : 'ศิษย์เก่า'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                      STATUS_STYLE[m.status] || 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {STATUS_LABEL[m.status] || m.status}
                  </span>
                </div>
                <div className="col-span-2 text-right pr-2 text-xs font-bold text-slate-700">
                  {m.totalPoints ?? 0} แต้ม
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2.5">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-xs text-slate-400">ไม่พบสมาชิกที่ตรงกับเงื่อนไข</p>
        ) : (
          filtered.map((m) => (
            <div
              key={m.id}
              onClick={() => setSelectedMember(m)}
              className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-2 cursor-pointer active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center gap-3">
                {m.avatarUrl ? (
                  <img
                    src={m.avatarUrl}
                    alt={m.name}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-white shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {m.name?.charAt(0) || '?'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 truncate">{m.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{m.studentId || 'ไม่ระบุรหัส'}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                    m.role === 'admin'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {m.role === 'admin' ? 'แอดมิน' : 'ศิษย์เก่า'}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                    STATUS_STYLE[m.status] || 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {STATUS_LABEL[m.status] || m.status}
                </span>
                {m.generation && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold border bg-violet-50 text-violet-700 border-violet-200">
                    {m.generation}
                  </span>
                )}
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-200">
                  {m.totalPoints ?? 0} แต้ม
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">{m.email}</p>
            </div>
          ))
        )}
      </div>

      {/* Member Detail Modal */}
      {selectedMember && (
        <div
          onClick={closeModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/10 p-4 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white p-6 shadow-2xl rounded-[32px] border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto animate-scale-up"
          >
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="text-center space-y-3 pt-2">
              {selectedMember.avatarUrl ? (
                <img
                  src={selectedMember.avatarUrl}
                  alt={selectedMember.name}
                  className="h-24 w-24 rounded-3xl object-cover mx-auto ring-4 ring-indigo-100 shadow-md"
                />
              ) : (
                <div className="h-24 w-24 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-3xl flex items-center justify-center mx-auto ring-4 ring-indigo-100 shadow-md">
                  {selectedMember.name?.charAt(0) || '?'}
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center justify-center gap-1.5 mb-1">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                      selectedMember.role === 'admin'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {selectedMember.role === 'admin' ? 'แอดมิน' : 'ศิษย์เก่า'}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                      STATUS_STYLE[selectedMember.status] || 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {STATUS_LABEL[selectedMember.status] || selectedMember.status}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">{selectedMember.name}</h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {selectedMember.studentId || 'ไม่ระบุรหัสนักศึกษา'}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-3 text-left">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 mt-0.5">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">อีเมล</p>
                  <p className="text-sm font-extrabold text-slate-800 break-words">{selectedMember.email}</p>
                </div>
              </div>

              {selectedMember.generation && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 mt-0.5">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">รุ่น</p>
                    <p className="text-sm font-extrabold text-slate-800 break-words">
                      {selectedMember.generation}
                      {selectedMember.studentStatus && (
                        <span className="ml-1.5 text-xs font-medium text-slate-500">
                          ({selectedMember.studentStatus === 'alumni' ? 'ศิษย์เก่า' : 'นักศึกษาปัจจุบัน'})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {selectedMember.province && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600 mt-0.5">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">จังหวัด</p>
                    <p className="text-sm font-extrabold text-slate-800 break-words">{selectedMember.province}</p>
                  </div>
                </div>
              )}

              {selectedMember.position && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 mt-0.5">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ตำแหน่งงาน</p>
                    <p className="text-sm font-extrabold text-slate-800 break-words">{selectedMember.position}</p>
                  </div>
                </div>
              )}

              {selectedMember.company && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 mt-0.5">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">บริษัท / หน่วยงาน</p>
                    <p className="text-sm font-extrabold text-slate-800 break-words">{selectedMember.company}</p>
                  </div>
                </div>
              )}

              {selectedMember.careerType && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 mt-0.5">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">กลุ่มสายอาชีพ</p>
                    <p className="text-sm font-extrabold text-slate-800 break-words">{selectedMember.careerType}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 mt-0.5">
                  <Star className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">แต้มสะสม</p>
                  <p className="text-sm font-extrabold text-slate-800">{selectedMember.totalPoints ?? 0} แต้ม</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600 mt-0.5">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">สมัครสมาชิกเมื่อ</p>
                  <p className="text-sm font-extrabold text-slate-800">{formatJoinDate(selectedMember.createdAt)}</p>
                </div>
              </div>
            </div>

            {onDelete && (
              <div className="pt-1">
                {!confirmingDelete ? (
                  <button
                    onClick={() => setConfirmingDelete(true)}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 font-extrabold text-sm hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    ลบสมาชิกนี้
                  </button>
                ) : (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 space-y-2.5">
                    <p className="text-xs font-bold text-rose-700">
                      ยืนยันการลบ &ldquo;{selectedMember.name}&rdquo;? ระบบจะลบข้อมูลทั้งหมดของสมาชิกคนนี้
                      (โพสต์ คอมเมนต์ โหวต รูปภาพ ฯลฯ) การกระทำนี้ไม่สามารถย้อนกลับได้
                    </p>
                    {deleteError && (
                      <p className="text-[11px] font-semibold text-rose-600">{deleteError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleConfirmDelete}
                        disabled={deleting}
                        className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {deleting ? 'กำลังลบ...' : 'ยืนยันลบ'}
                      </button>
                      <button
                        onClick={() => {
                          setConfirmingDelete(false);
                          setDeleteError('');
                        }}
                        disabled={deleting}
                        className="flex-1 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-extrabold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function formatJoinDate(value: string): string {
  if (!value) return 'ไม่ทราบวันที่';
  const date = new Date(value);
  if (isNaN(date.getTime())) return 'ไม่ทราบวันที่';
  return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
}
