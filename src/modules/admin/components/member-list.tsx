'use client';

import { useState, useMemo } from 'react';
import { formatPhone } from '@/lib/phone';
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
  AlertTriangle,
  Phone,
  Crown,
  Download,
  SlidersHorizontal,
} from 'lucide-react';
import { ModalPortal } from '@/components/ui/modal-portal';

export interface AdminMember {
  id: number;
  studentId: string | null;
  name: string;
  email: string;
  phone: string | null;
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
  isGenerationLeader?: boolean;
}

interface MemberListProps {
  members: AdminMember[];
  onDelete?: (userId: number) => Promise<void> | void;
  onChangeStudentStatus?: (userId: number, studentStatus: 'studying' | 'alumni') => Promise<void> | void;
  onToggleGenerationLeader?: (userId: number, makeLeader: boolean) => Promise<void> | void;
}

type StatusFilter = 'all' | 'approved' | 'pending' | 'rejected';
// role = 'alumni' แปลว่า "สมาชิกทั่วไป" (รวมศิษย์ปัจจุบัน) — แยกศิษย์เก่า/ปัจจุบันด้วย studentStatus แทน
type RoleFilter = 'all' | 'admin' | 'alumni' | 'studying';
type SortKey = 'newest' | 'oldest' | 'name' | 'studentId' | 'points' | 'generation';

const SORT_LABEL: Record<SortKey, string> = {
  newest: 'สมัครล่าสุด',
  oldest: 'สมัครก่อนสุด',
  name: 'ชื่อ ก-ฮ',
  studentId: 'รหัสนักศึกษา',
  points: 'แต้มมากสุด',
  generation: 'รุ่น (น้อย→มาก)',
};

/** เลขรุ่นจาก label "รุ่น 28" → 28 (ไม่มี = ไว้ท้ายสุด) */
function generationNumber(label: string | null): number {
  const n = parseInt(String(label ?? '').replace(/\D/g, ''), 10);
  return Number.isNaN(n) ? Number.MAX_SAFE_INTEGER : n;
}

function uniqueSorted(values: (string | null)[], compare?: (a: string, b: string) => number): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v && v.trim())))].sort(compare ?? ((a, b) => a.localeCompare(b, 'th')));
}

/** ดาวน์โหลดรายชื่อที่กรองอยู่เป็น CSV (มี BOM ให้ Excel อ่านภาษาไทยได้) — เบอร์โทรรวมอยู่ด้วย ใช้ภายในแอดมินเท่านั้น */
function downloadMembersCsv(list: AdminMember[]) {
  const header = ['รหัสนักศึกษา', 'ชื่อ', 'อีเมล', 'เบอร์โทร', 'รุ่น', 'สถานะการศึกษา', 'หัวหน้ารุ่น', 'สถานะบัญชี', 'จังหวัด', 'สายงาน', 'บริษัท', 'ตำแหน่ง', 'แต้ม', 'สมัครเมื่อ'];
  const rows = list.map((m) => [
    m.studentId ?? '', m.name, m.email ?? '', m.phone ?? '', m.generation ?? '',
    m.role === 'admin' ? 'แอดมิน' : m.studentStatus === 'studying' ? 'ศิษย์ปัจจุบัน' : 'ศิษย์เก่า',
    m.isGenerationLeader ? 'ใช่' : '', STATUS_LABEL[m.status] ?? m.status, m.province ?? '', m.careerType ?? '',
    m.company ?? '', m.position ?? '', m.totalPoints ?? 0, m.createdAt ? new Date(m.createdAt).toLocaleDateString('th-TH') : '',
  ]);
  const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `members-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function memberTypeLabel(m: AdminMember): string {
  if (m.role === 'admin') return 'แอดมิน';
  return m.studentStatus === 'studying' ? 'ศิษย์ปัจจุบัน' : 'ศิษย์เก่า';
}

function memberTypeStyle(m: AdminMember): string {
  if (m.role === 'admin') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  return m.studentStatus === 'studying'
    ? 'bg-sky-50 text-sky-700 border-sky-200'
    : 'bg-slate-50 text-slate-600 border-slate-200';
}

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

export function MemberList({ members, onDelete, onChangeStudentStatus, onToggleGenerationLeader }: MemberListProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [generationFilter, setGenerationFilter] = useState('all');
  const [provinceFilter, setProvinceFilter] = useState('all');
  const [careerFilter, setCareerFilter] = useState('all');
  const [studentIdPrefix, setStudentIdPrefix] = useState('');
  const [leaderOnly, setLeaderOnly] = useState(false);
  const [phoneFilter, setPhoneFilter] = useState<'all' | 'has' | 'none'>('all');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [selectedMember, setSelectedMember] = useState<AdminMember | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [savingLeader, setSavingLeader] = useState(false);
  const [leaderError, setLeaderError] = useState('');

  // ลบเร็วจากแถวในรายชื่อโดยตรง ไม่ต้องเปิด modal รายละเอียดก่อน — ยังคงต้องกดยืนยันซ้ำ
  // เพราะเป็นการลบถาวร ไม่ใช่แค่เปลี่ยนสถานะ
  const [quickDeleteId, setQuickDeleteId] = useState<number | null>(null);
  const [quickDeleting, setQuickDeleting] = useState<number | null>(null);
  const [quickDeleteError, setQuickDeleteError] = useState<Record<number, string>>({});

  async function handleQuickDelete(userId: number) {
    if (!onDelete) return;
    setQuickDeleting(userId);
    try {
      await onDelete(userId);
      setQuickDeleteId(null);
    } catch (err: any) {
      setQuickDeleteError((prev) => ({ ...prev, [userId]: err?.message || 'เกิดข้อผิดพลาดในการลบสมาชิก' }));
    } finally {
      setQuickDeleting(null);
    }
  }

  function closeModal() {
    setSelectedMember(null);
    setConfirmingDelete(false);
    setDeleteError('');
    setStatusError('');
    setLeaderError('');
  }

  async function handleToggleLeader(makeLeader: boolean) {
    if (!selectedMember || !onToggleGenerationLeader) return;
    setSavingLeader(true);
    setLeaderError('');
    try {
      await onToggleGenerationLeader(selectedMember.id, makeLeader);
      setSelectedMember({ ...selectedMember, isGenerationLeader: makeLeader });
    } catch (err: any) {
      setLeaderError(err?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSavingLeader(false);
    }
  }

  async function handleChangeStudentStatus(next: 'studying' | 'alumni') {
    if (!selectedMember || !onChangeStudentStatus) return;
    setSavingStatus(true);
    setStatusError('');
    try {
      await onChangeStudentStatus(selectedMember.id, next);
      setSelectedMember({ ...selectedMember, studentStatus: next });
    } catch (err: any) {
      setStatusError(err?.message || 'เปลี่ยนสถานะไม่สำเร็จ');
    } finally {
      setSavingStatus(false);
    }
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

  // ตัวเลือกในตัวกรอง สร้างจากข้อมูลสมาชิกที่มีจริง
  const generationOptions = useMemo(
    () => uniqueSorted(members.map((m) => m.generation), (a, b) => generationNumber(a) - generationNumber(b)),
    [members]
  );
  const provinceOptions = useMemo(() => uniqueSorted(members.map((m) => m.province)), [members]);
  const careerOptions = useMemo(() => uniqueSorted(members.map((m) => m.careerType)), [members]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const idPrefix = studentIdPrefix.replace(/\D/g, '');
    const list = members.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (roleFilter === 'admin' && m.role !== 'admin') return false;
      if ((roleFilter === 'alumni' || roleFilter === 'studying') &&
          (m.role === 'admin' || (m.studentStatus === 'studying' ? 'studying' : 'alumni') !== roleFilter)) return false;
      if (generationFilter !== 'all' && m.generation !== generationFilter) return false;
      if (provinceFilter !== 'all' && m.province !== provinceFilter) return false;
      if (careerFilter !== 'all' && m.careerType !== careerFilter) return false;
      if (idPrefix && !(m.studentId || '').startsWith(idPrefix)) return false;
      if (leaderOnly && !m.isGenerationLeader) return false;
      if (phoneFilter === 'has' && !m.phone) return false;
      if (phoneFilter === 'none' && m.phone) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        (m.studentId || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        (m.phone || '').includes(q.replace(/\D/g, '') || '\u0000') ||
        (m.company || '').toLowerCase().includes(q)
      );
    });

    const byText = (a: string | null, b: string | null) => (a || '\uffff').localeCompare(b || '\uffff', 'th');
    const time = (m: AdminMember) => new Date(m.createdAt).getTime() || 0;
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return time(a) - time(b);
        case 'name': return a.name.localeCompare(b.name, 'th');
        case 'studentId': return byText(a.studentId, b.studentId);
        case 'points': return (b.totalPoints ?? 0) - (a.totalPoints ?? 0);
        case 'generation': return generationNumber(a.generation) - generationNumber(b.generation) || a.name.localeCompare(b.name, 'th');
        default: return time(b) - time(a);
      }
    });
  }, [members, query, statusFilter, roleFilter, generationFilter, provinceFilter, careerFilter, studentIdPrefix, leaderOnly, phoneFilter, sortBy]);

  // ป้ายตัวกรองที่ใช้อยู่ — กด × เพื่อล้างทีละตัว
  const activeFilters: { label: string; clear: () => void }[] = [
    statusFilter !== 'all' && { label: `สถานะ: ${STATUS_LABEL[statusFilter]}`, clear: () => setStatusFilter('all') },
    roleFilter !== 'all' && {
      label: `ประเภท: ${{ alumni: 'ศิษย์เก่า', studying: 'ศิษย์ปัจจุบัน', admin: 'แอดมิน' }[roleFilter]}`,
      clear: () => setRoleFilter('all'),
    },
    generationFilter !== 'all' && { label: generationFilter, clear: () => setGenerationFilter('all') },
    studentIdPrefix.replace(/\D/g, '') && { label: `รหัสขึ้นต้น ${studentIdPrefix.replace(/\D/g, '')}`, clear: () => setStudentIdPrefix('') },
    provinceFilter !== 'all' && { label: `จังหวัด: ${provinceFilter}`, clear: () => setProvinceFilter('all') },
    careerFilter !== 'all' && { label: `สายงาน: ${careerFilter}`, clear: () => setCareerFilter('all') },
    leaderOnly && { label: '👑 หัวหน้ารุ่น', clear: () => setLeaderOnly(false) },
    phoneFilter !== 'all' && { label: phoneFilter === 'has' ? 'มีเบอร์โทร' : 'ไม่มีเบอร์โทร', clear: () => setPhoneFilter('all') },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  function clearAllFilters() {
    setQuery('');
    setStatusFilter('all');
    setRoleFilter('all');
    setGenerationFilter('all');
    setProvinceFilter('all');
    setCareerFilter('all');
    setStudentIdPrefix('');
    setLeaderOnly(false);
    setPhoneFilter('all');
  }

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
      <div className="space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาชื่อ, รหัสนักศึกษา, อีเมล, เบอร์โทร หรือบริษัท..."
              className="w-full h-10 rounded-2xl border border-slate-200 bg-white pl-9 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-indigo-400 focus:outline-none cursor-pointer sm:w-44" title="เรียงลำดับ">
            {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
              <option key={k} value={k}>เรียง: {SORT_LABEL[k]}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => downloadMembersCsv(filtered)}
            disabled={filtered.length === 0}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-indigo-600 px-4 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-40 cursor-pointer"
            title="ดาวน์โหลดเฉพาะรายชื่อที่กรองอยู่"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-indigo-400 focus:outline-none cursor-pointer">
            <option value="all">ทุกสถานะ</option>
            <option value="approved">อนุมัติแล้ว</option>
            <option value="pending">รออนุมัติ</option>
            <option value="rejected">ปฏิเสธแล้ว</option>
          </select>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as RoleFilter)} className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-indigo-400 focus:outline-none cursor-pointer">
            <option value="all">ทุกประเภท</option>
            <option value="alumni">ศิษย์เก่า</option>
            <option value="studying">ศิษย์ปัจจุบัน</option>
            <option value="admin">แอดมิน</option>
          </select>
          <select value={generationFilter} onChange={(e) => setGenerationFilter(e.target.value)} className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-indigo-400 focus:outline-none cursor-pointer">
            <option value="all">ทุกรุ่น</option>
            {generationOptions.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <input
            type="text"
            inputMode="numeric"
            value={studentIdPrefix}
            onChange={(e) => setStudentIdPrefix(e.target.value)}
            placeholder="รหัส นศ. ขึ้นต้น เช่น 65"
            className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
          />
          <select value={provinceFilter} onChange={(e) => setProvinceFilter(e.target.value)} className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-indigo-400 focus:outline-none cursor-pointer">
            <option value="all">ทุกจังหวัด</option>
            {provinceOptions.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={careerFilter} onChange={(e) => setCareerFilter(e.target.value)} className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-indigo-400 focus:outline-none cursor-pointer">
            <option value="all">ทุกสายงาน</option>
            {careerOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={phoneFilter} onChange={(e) => setPhoneFilter(e.target.value as 'all' | 'has' | 'none')} className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-indigo-400 focus:outline-none cursor-pointer">
            <option value="all">เบอร์โทร: ทั้งหมด</option>
            <option value="has">มีเบอร์โทร</option>
            <option value="none">ไม่มีเบอร์โทร</option>
          </select>
          <button
            type="button"
            onClick={() => setLeaderOnly((v) => !v)}
            aria-pressed={leaderOnly}
            className={`h-10 rounded-2xl border px-3 text-xs font-semibold transition-colors cursor-pointer ${
              leaderOnly ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            👑 หัวหน้ารุ่น
          </button>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
            {activeFilters.map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={f.clear}
                className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:border-indigo-300 cursor-pointer"
                title="ล้างตัวกรองนี้"
              >
                {f.label} <X className="h-3 w-3" />
              </button>
            ))}
            <button type="button" onClick={clearAllFilters} className="ml-1 text-[11px] font-semibold text-slate-400 underline underline-offset-2 hover:text-slate-600 cursor-pointer">
              ล้างทั้งหมด
            </button>
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-2xl border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-slate-50/90 border-b border-slate-200/70 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
          <div className="col-span-4">สมาชิก</div>
          <div className="col-span-2">รุ่น</div>
          <div className="col-span-2">ประเภท</div>
          <div className="col-span-2">สถานะ</div>
          <div className="col-span-1 text-right">แต้ม</div>
          <div className="col-span-1 text-right">ลบ</div>
        </div>
        <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-xs text-slate-400">ไม่พบสมาชิกที่ตรงกับเงื่อนไข</p>
          ) : (
            filtered.map((m) =>
              quickDeleteId === m.id ? (
                <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-rose-50/70">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                    <span className="text-xs font-bold text-rose-700 truncate">
                      ยืนยันลบ &ldquo;{m.name}&rdquo; ถาวร? {quickDeleteError[m.id] && `— ${quickDeleteError[m.id]}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      disabled={quickDeleting === m.id}
                      onClick={() => handleQuickDelete(m.id)}
                      className="rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-extrabold text-white hover:bg-rose-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {quickDeleting === m.id ? 'กำลังลบ...' : 'ยืนยันลบ'}
                    </button>
                    <button
                      disabled={quickDeleting === m.id}
                      onClick={() => setQuickDeleteId(null)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              ) : (
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
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${memberTypeStyle(m)}`}>
                      {memberTypeLabel(m)}
                    </span>
                    {m.isGenerationLeader && (
                      <span className="ml-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        👑 หัวหน้ารุ่น
                      </span>
                    )}
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
                  <div className="col-span-1 text-right text-xs font-bold text-slate-700">
                    {m.totalPoints ?? 0}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickDeleteId(m.id);
                        }}
                        title="ลบสมาชิกนี้"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2.5">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-xs text-slate-400">ไม่พบสมาชิกที่ตรงกับเงื่อนไข</p>
        ) : (
          filtered.map((m) =>
            quickDeleteId === m.id ? (
              <div key={m.id} className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  <p className="text-xs font-bold text-rose-700">ยืนยันลบ &ldquo;{m.name}&rdquo; ถาวร?</p>
                </div>
                {quickDeleteError[m.id] && (
                  <p className="text-[11px] font-semibold text-rose-600">{quickDeleteError[m.id]}</p>
                )}
                <div className="flex gap-2">
                  <button
                    disabled={quickDeleting === m.id}
                    onClick={() => handleQuickDelete(m.id)}
                    className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {quickDeleting === m.id ? 'กำลังลบ...' : 'ยืนยันลบ'}
                  </button>
                  <button
                    disabled={quickDeleting === m.id}
                    onClick={() => setQuickDeleteId(null)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-extrabold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={m.id}
                onClick={() => setSelectedMember(m)}
                className="relative rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-2 cursor-pointer active:scale-[0.99] transition-transform"
              >
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickDeleteId(m.id);
                    }}
                    title="ลบสมาชิกนี้"
                    className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <div className="flex items-center gap-3 pr-8">
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
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${memberTypeStyle(m)}`}>
                    {memberTypeLabel(m)}
                  </span>
                  {m.isGenerationLeader && (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      👑 หัวหน้ารุ่น
                    </span>
                  )}
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
            )
          )
        )}
      </div>

      {/* Member Detail Modal */}
      {selectedMember && (
        <ModalPortal>
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
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${memberTypeStyle(selectedMember)}`}>
                      {memberTypeLabel(selectedMember)}
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

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 mt-0.5">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">เบอร์โทรศัพท์ (แอดมินเท่านั้น)</p>
                    {selectedMember.phone ? (
                      <a href={`tel:${selectedMember.phone}`} className="text-sm font-extrabold text-slate-800 hover:text-indigo-600">
                        {formatPhone(selectedMember.phone)}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-slate-400">ไม่ได้กรอก</p>
                    )}
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

              {onToggleGenerationLeader && selectedMember.role !== 'admin' && (() => {
              const currentLeader = members.find(
                (m) => m.isGenerationLeader && m.generation === selectedMember.generation && m.id !== selectedMember.id
              );
              const canAppoint = selectedMember.status === 'approved' && Boolean(selectedMember.generation);
              return (
                <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5 space-y-2">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                    <Crown className="h-3.5 w-3.5" /> หัวหน้ารุ่น
                  </p>
                  {selectedMember.isGenerationLeader ? (
                    <>
                      <p className="text-xs text-slate-600">
                        เป็นหัวหน้า<b>{selectedMember.generation}</b> — ยืนยันสมาชิกใหม่และตั้งคำถามคลังภาพของรุ่นได้
                      </p>
                      <button
                        disabled={savingLeader}
                        onClick={() => handleToggleLeader(false)}
                        className="w-full py-2 rounded-xl border border-slate-200 bg-white text-xs font-extrabold text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                      >
                        {savingLeader ? 'กำลังบันทึก...' : 'ถอดจากหัวหน้ารุ่น'}
                      </button>
                    </>
                  ) : canAppoint ? (
                    <>
                      <p className="text-xs text-slate-600">
                        {currentLeader ? (
                          <>หัวหน้า{selectedMember.generation}ตอนนี้คือ <b>{currentLeader.name}</b> — แต่งตั้งคนนี้จะแทนที่คนเดิม</>
                        ) : (
                          <>{selectedMember.generation}ยังไม่มีหัวหน้ารุ่น</>
                        )}
                      </p>
                      <button
                        disabled={savingLeader}
                        onClick={() => handleToggleLeader(true)}
                        className="w-full py-2 rounded-xl bg-amber-500 text-xs font-extrabold text-white hover:bg-amber-600 disabled:opacity-50 cursor-pointer"
                      >
                        {savingLeader ? 'กำลังบันทึก...' : `👑 แต่งตั้งเป็นหัวหน้า${selectedMember.generation}`}
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500">
                      แต่งตั้งได้เฉพาะสมาชิกที่อนุมัติแล้วและระบุรุ่นแล้ว
                    </p>
                  )}
                  {leaderError && <p className="text-[11px] font-semibold text-rose-600">{leaderError}</p>}
                </div>
              );
            })()}

            {onChangeStudentStatus && selectedMember.role !== 'admin' && (
                <div className="rounded-2xl border border-slate-100 p-3.5 space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">สถานะการศึกษา</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      ['studying', 'ศิษย์ปัจจุบัน'],
                      ['alumni', 'ศิษย์เก่า'],
                    ] as const).map(([value, label]) => {
                      const isCurrent = (selectedMember.studentStatus === 'studying' ? 'studying' : 'alumni') === value;
                      return (
                        <button
                          key={value}
                          disabled={savingStatus || isCurrent}
                          onClick={() => handleChangeStudentStatus(value)}
                          className={`py-2 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer disabled:cursor-default ${
                            isCurrent
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 disabled:opacity-50'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    ปกติสมาชิกยืนยันเองที่หน้าโปรไฟล์ ใช้แก้กรณีสถานะไม่ตรงความจริง (บันทึกใน Audit Log)
                  </p>
                  {statusError && <p className="text-[11px] font-semibold text-rose-600">{statusError}</p>}
                </div>
              )}

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
        </ModalPortal>
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
