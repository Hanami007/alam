'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Building2,
  ChevronRight,
  Download,
  EyeOff,
  Flag,
  Heart,
  HeartHandshake,
  Image as ImageIcon,
  Layers,
  Loader2,
  LogIn,
  MapPin,
  MessageCircle,
  Newspaper,
  RefreshCw,
  ShieldBan,
  Sparkles,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  Vote,
} from 'lucide-react';
import type { AdminStats as AdminStatsData, CountItem } from '@/modules/admin/services/stats.service';

/**
 * แท็บ "สถิติ" — ข้อมูลจริงจาก GET /api/admin/stats
 *
 * กราฟทุกตัวเป็นชุดข้อมูลเดียว ใช้สีเดียว (indigo-500 ผ่านเกณฑ์ contrast บนพื้นขาว) จึงไม่มี legend —
 * หัวกราฟบอกแล้วว่าวัดอะไร แท่งปลายมน 4px ตัวเลขใช้สีตัวหนังสือ ไม่ใช้สีแท่ง
 * ไอคอนสีในการ์ดเป็นแค่ของตกแต่ง ความหมายอยู่ที่ข้อความเสมอ
 * ชี้เมาส์ที่แท่งเพื่อดูค่า และดาวน์โหลด CSV ได้ (ใช้แทนมุมมองตาราง)
 */

const nf = new Intl.NumberFormat('th-TH');

type AdminTab = 'users' | 'reports' | 'posts' | 'members';

function monthLabel(yyyyMm: string, withYear = false) {
  const [y, m] = yyyyMm.split('-').map(Number);
  return new Intl.DateTimeFormat('th-TH', withYear ? { month: 'short', year: '2-digit' } : { month: 'short' }).format(
    new Date(y, m - 1, 1)
  );
}

// ─── ชิ้นส่วน ────────────────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, title, caption }: { icon: typeof Users; title: string; caption?: string }) {
  return (
    <div className="flex items-end justify-between gap-3 px-1">
      <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
        <Icon className="h-4 w-4 text-indigo-500" /> {title}
      </h3>
      {caption && <p className="text-[11px] text-slate-400">{caption}</p>}
    </div>
  );
}

function StatTile({
  icon: Icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  tone: string;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-slate-500 leading-snug">{label}</p>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-extrabold tabular-nums text-slate-900">{nf.format(value)}</p>
      {hint && <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

function Card({ title, subtitle, children, className = '' }: { title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-card ${className}`}>
      <div className="mb-4">
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Empty({ text = 'ยังไม่มีข้อมูล' }: { text?: string }) {
  return <p className="rounded-2xl bg-slate-50 py-8 text-center text-xs text-slate-400">{text}</p>;
}

/** แท่งแนวนอนบนแถบพื้น (ขั้นสีอ่อนของ ramp เดียวกัน) — ตัวเลขอยู่ท้ายแถว ใช้แทนตาราง */
function HBarChart({ items, unit = 'คน', empty }: { items: CountItem[]; unit?: string; empty?: string }) {
  if (items.length === 0) return <Empty text={empty} />;
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label} title={`${item.label}: ${nf.format(item.count)} ${unit}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="truncate text-xs font-medium text-slate-600">{item.label}</span>
            <span className="shrink-0 text-xs font-bold tabular-nums text-slate-800">
              {nf.format(item.count)} <span className="font-normal text-slate-400">{unit}</span>
            </span>
          </div>
          <div className="h-2.5 w-full rounded-[4px] bg-indigo-50">
            <div className="h-full rounded-[4px] bg-indigo-500" style={{ width: `${Math.max((item.count / max) * 100, 3)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** คอลัมน์รายเดือน — ติดตัวเลขเฉพาะเดือนล่าสุดและเดือนที่สูงสุด ที่เหลือดูจาก tooltip */
function MonthColumnChart({ items }: { items: CountItem[] }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  const peakIndex = items.reduce((best, item, i) => (item.count > items[best].count ? i : best), 0);
  const total = items.reduce((sum, i) => sum + i.count, 0);
  if (total === 0) return <Empty text="ยังไม่มีการสมัครใน 12 เดือนนี้" />;

  return (
    <div>
      <div className="relative h-44">
        {/* เส้นตารางบาง 3 เส้น (ทึบ ไม่ใช่เส้นประ) */}
        {[0.25, 0.5, 0.75].map((f) => (
          <div key={f} className="absolute inset-x-0 border-t border-slate-100" style={{ bottom: `${f * 85}%` }} />
        ))}
        <div className="relative flex h-full items-end gap-1 border-b border-slate-200 sm:gap-2">
          {items.map((item, i) => {
            const showLabel = item.count > 0 && (i === items.length - 1 || i === peakIndex);
            return (
              <div key={item.label} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                {showLabel && <span className="mb-1 text-[11px] font-bold text-slate-700 tabular-nums">{nf.format(item.count)}</span>}
                <div
                  className={`w-full max-w-6 rounded-t-[4px] bg-indigo-500 transition-opacity group-hover:opacity-80 ${item.count === 0 ? 'opacity-0' : ''}`}
                  style={{ height: `${(item.count / max) * 85}%` }}
                />
                {/* tooltip — พื้นที่ชี้เมาส์คือทั้งคอลัมน์ ไม่ใช่แค่แท่ง */}
                <div className="pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[11px] text-white shadow-lg group-hover:block">
                  {monthLabel(item.label, true)} · {nf.format(item.count)} คน
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 flex gap-1 sm:gap-2">
        {items.map((item, i) => (
          <span
            key={item.label}
            className={`flex-1 text-center text-[10px] ${i === items.length - 1 ? 'font-bold text-slate-600' : 'text-slate-400'}`}
          >
            {monthLabel(item.label)}
          </span>
        ))}
      </div>
    </div>
  );
}

function AttentionChip({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: typeof Flag;
  label: string;
  value: number;
  onClick?: () => void;
}) {
  const needsAction = value > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`group flex items-center gap-3 rounded-[20px] border px-4 py-3 text-left transition-all disabled:cursor-default ${
        needsAction
          ? 'border-amber-200 bg-amber-50 hover:border-amber-300 hover:shadow-sm'
          : 'border-slate-200/80 bg-white hover:bg-slate-50'
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          needsAction ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-600">{label}</p>
        <p className="text-[11px] text-slate-500">
          {needsAction ? (
            <>
              <span className="text-sm font-extrabold text-slate-900 tabular-nums">{nf.format(value)}</span> รายการรอดำเนินการ
            </>
          ) : (
            'ไม่มีงานค้าง ✓'
          )}
        </p>
      </div>
      {onClick && <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5" />}
    </button>
  );
}

// ─── CSV ─────────────────────────────────────────────────────────────────────

const ENGAGEMENT_LABELS: Record<keyof AdminStatsData['engagement'], string> = {
  publishedPosts: 'โพสต์ที่เผยแพร่',
  pendingPostRequests: 'คำขอโพสต์รอตรวจ',
  comments: 'ความคิดเห็น',
  postReactions: 'ถูกใจโพสต์',
  commentReactions: 'ถูกใจความคิดเห็น',
  pollVotes: 'โหวตโพล',
  yearbookLikes: 'ถูกใจหนังสือรุ่น',
  hofVotesCurrentCampaign: 'โหวต HOF รอบปัจจุบัน',
  photos: 'รูปภาพในระบบ',
  postsLast30Days: 'โพสต์ใหม่ 30 วัน',
  commentsLast30Days: 'ความคิดเห็นใหม่ 30 วัน',
};

function downloadCsv(stats: AdminStatsData) {
  const rows: (string | number)[][] = [['หมวด', 'รายการ', 'จำนวน']];
  const add = (section: string, label: string, value: number) => rows.push([section, label, value]);
  const m = stats.members;
  add('สมาชิก', 'อนุมัติแล้ว', m.approved);
  add('สมาชิก', 'รออนุมัติ', m.pending);
  add('สมาชิก', 'ถูกปฏิเสธ', m.rejected);
  add('สมาชิก', 'ศิษย์เก่า', m.alumni);
  add('สมาชิก', 'ศิษย์ปัจจุบัน', m.studying);
  add('สมาชิก', 'ยินดีให้คำแนะนำ', m.mentors);
  add('สมาชิก', 'อยู่ในหนังสือรุ่น', m.inYearbook);
  add('สมาชิก', 'สมัครใหม่ 30 วัน', m.newLast30Days);
  add('ผู้ใช้ active', 'ออนไลน์ตอนนี้ (10 นาที)', m.activeNow);
  add('ผู้ใช้ active', 'วันนี้', m.activeToday);
  add('ผู้ใช้ active', '7 วันล่าสุด', m.active7Days);
  add('ผู้ใช้ active', '30 วันล่าสุด', m.activeLast30Days);
  add('สมาชิก', 'หัวหน้ารุ่น', m.generationLeaders);
  stats.signupsByMonth.forEach((i) => add('สมัครรายเดือน', i.label, i.count));
  stats.byGeneration.forEach((i) => add('สมาชิกตามรุ่น', i.label, i.count));
  stats.hometownProvinces.forEach((i) => add('จังหวัดภูมิลำเนา', i.label, i.count));
  stats.workLocations.forEach((i) => add('สถานที่ทำงาน', i.label, i.count));
  stats.careerTypes.forEach((i) => add('ประเภทสายงาน', i.label, i.count));
  stats.topCompanies.forEach((i) => add('บริษัท/องค์กร', i.label, i.count));
  (Object.keys(ENGAGEMENT_LABELS) as (keyof AdminStatsData['engagement'])[]).forEach((key) =>
    add('กิจกรรม', ENGAGEMENT_LABELS[key], stats.engagement[key])
  );
  stats.topContributors.forEach((c) => add('แต้มสะสมสูงสุด', c.name, c.points));
  add('ดูแลเนื้อหา', 'รายงานรอตรวจ', stats.moderation.pendingReports);
  add('ดูแลเนื้อหา', 'โพสต์ที่ซ่อน', stats.moderation.hiddenPosts);
  add('ดูแลเนื้อหา', 'ความคิดเห็นที่ซ่อน', stats.moderation.hiddenComments);
  add('ดูแลเนื้อหา', 'คำต้องห้าม', stats.moderation.bannedKeywords);

  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  // BOM ให้ Excel อ่านภาษาไทยถูก
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `alumni-stats-${stats.generatedAt.slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── หน้าแท็บ ────────────────────────────────────────────────────────────────

export function AdminStats({ onNavigate }: { onNavigate?: (tab: AdminTab) => void }) {
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'โหลดสถิติไม่สำเร็จ');
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'โหลดสถิติไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- โหลดข้อมูลครั้งแรกเมื่อเปิดแท็บ
    load();
  }, [load]);

  if (loading && !stats) {
    return (
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-[28px] bg-indigo-100/60" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-[20px] bg-slate-100" />)}
        </div>
        <p className="flex items-center justify-center gap-2 py-4 text-xs text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลดสถิติ...
        </p>
      </div>
    );
  }
  if (error && !stats) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[28px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
        <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> {error}</span>
        <button onClick={load} className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700">ลองใหม่</button>
      </div>
    );
  }
  if (!stats) return null;

  const m = stats.members;
  const e = stats.engagement;
  const updated = new Date(stats.generatedAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  const alumniPct = m.approved > 0 ? (m.alumni / m.approved) * 100 : 0;
  const signups12m = stats.signupsByMonth.reduce((sum, i) => sum + i.count, 0);
  const topPoints = stats.topContributors[0]?.points || 1;

  return (
    <div className="space-y-7">
      {/* ── แถบหลัก: ตัวเลขเด่นตัวเดียวของหน้า ─────────────────────────── */}
      <section className="gradient-primary relative overflow-hidden rounded-[28px] p-6 text-white shadow-hero sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-white/5" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold text-white/80">
              <BarChart3 className="h-4 w-4" /> สมาชิกในระบบ (อนุมัติแล้ว)
            </p>
            <p className="mt-1 text-5xl font-extrabold tabular-nums tracking-tight">{nf.format(m.approved)}</p>
            <p className="mt-2 text-xs text-white/80">
              สมัครใหม่ <span className="font-bold text-white">+{nf.format(m.newLast30Days)}</span> คนใน 30 วัน ·
              หัวหน้ารุ่น <span className="font-bold text-white">{nf.format(m.generationLeaders)}</span> คน
            </p>

            {/* ผู้ใช้ active — นับจากการใช้งานจริง (ไม่ใช่แค่การล็อกอิน) */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: 'ออนไลน์ตอนนี้', value: m.activeNow, live: true },
                { label: 'ใช้งานวันนี้', value: m.activeToday },
                { label: '7 วันล่าสุด', value: m.active7Days },
                { label: '30 วันล่าสุด', value: m.activeLast30Days },
              ].map((a) => (
                <div key={a.label} className="rounded-2xl bg-white/12 px-3 py-2 backdrop-blur-sm">
                  <p className="flex items-center gap-1.5 text-[11px] text-white/80">
                    {a.live && (
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                      </span>
                    )}
                    {a.label}
                  </p>
                  <p className="text-xl font-extrabold tabular-nums">{nf.format(a.value)} <span className="text-xs font-medium text-white/70">คน</span></p>
                </div>
              ))}
            </div>
          </div>

          {/* สัดส่วนศิษย์เก่า / ศิษย์ปัจจุบัน — มีข้อความกำกับ ไม่ใช้สีอย่างเดียว */}
          <div className="w-full max-w-sm">
            <div className="mb-1.5 flex justify-between text-xs">
              <span>🎓 ศิษย์เก่า <b className="tabular-nums">{nf.format(m.alumni)}</b></span>
              <span>📚 ศิษย์ปัจจุบัน <b className="tabular-nums">{nf.format(m.studying)}</b></span>
            </div>
            <div className="flex h-3 gap-0.5 overflow-hidden rounded-[4px]">
              {m.alumni > 0 && <div className="bg-white" style={{ width: `${alumniPct}%` }} />}
              {m.studying > 0 && <div className="flex-1 bg-white/35" />}
              {m.approved === 0 && <div className="flex-1 bg-white/20" />}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-white/70">อัปเดต {updated} · ไม่นับบัญชีแอดมิน</p>
              <div className="flex gap-2">
                <button
                  onClick={load}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/25 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> รีเฟรช
                </button>
                <button
                  onClick={() => downloadCsv(stats)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50"
                >
                  <Download className="h-3.5 w-3.5" /> ดาวน์โหลด CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── งานค้าง ───────────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <AttentionChip icon={UserCheck} label="สมาชิกรออนุมัติ" value={m.pending} onClick={onNavigate && (() => onNavigate('users'))} />
        <AttentionChip icon={Flag} label="รายงานเนื้อหา" value={stats.moderation.pendingReports} onClick={onNavigate && (() => onNavigate('reports'))} />
        <AttentionChip icon={Layers} label="คำขอโพสต์" value={e.pendingPostRequests} onClick={onNavigate && (() => onNavigate('posts'))} />
      </div>

      {/* ── สมาชิก ───────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionTitle icon={Users} title="ภาพรวมสมาชิก" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile icon={UserPlus} tone="bg-indigo-50 text-indigo-600" label="สมัครใหม่ (30 วัน)" value={m.newLast30Days} />
          <StatTile icon={LogIn} tone="bg-sky-50 text-sky-600" label="ใช้งานใน 7 วัน" value={m.active7Days} hint={`วันนี้ ${nf.format(m.activeToday)} คน`} />
          <StatTile icon={HeartHandshake} tone="bg-emerald-50 text-emerald-600" label="ยินดีให้คำแนะนำ" value={m.mentors} />
          <StatTile icon={BookOpen} tone="bg-purple-50 text-purple-600" label="อยู่ในหนังสือรุ่น" value={m.inYearbook} hint={m.rejected > 0 ? `ถูกปฏิเสธ ${nf.format(m.rejected)} คน` : undefined} />
        </div>
        <Card title="ผู้สมัครรายเดือน" subtitle={`12 เดือนล่าสุด · รวม ${nf.format(signups12m)} คน · ชี้ที่แท่งเพื่อดูจำนวน`}>
          <MonthColumnChart items={stats.signupsByMonth} />
        </Card>
      </div>

      {/* ── ข้อมูลศิษย์เก่า ───────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionTitle icon={MapPin} title="ข้อมูลศิษย์เก่า" caption="นับเฉพาะสมาชิกที่อนุมัติแล้ว" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="สมาชิกตามรุ่น" subtitle="เรียงตามรุ่น">
            <HBarChart items={stats.byGeneration} />
          </Card>
          <Card title="ประเภทสายงาน" subtitle="เฉพาะคนที่กรอกที่ทำงาน">
            <HBarChart items={stats.careerTypes} empty="ยังไม่มีใครกรอกที่ทำงาน" />
          </Card>
          <Card title="จังหวัดภูมิลำเนา" subtitle="8 อันดับแรก">
            <HBarChart items={stats.hometownProvinces} />
          </Card>
          <Card title="สถานที่ทำงาน" subtitle="8 อันดับแรก รวมต่างประเทศ">
            <HBarChart items={stats.workLocations} empty="ยังไม่มีใครกรอกที่ทำงาน" />
          </Card>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="บริษัท / องค์กรที่มีศิษย์เก่ามากที่สุด" subtitle="5 อันดับแรก">
            {stats.topCompanies.length === 0 ? (
              <Empty text="ยังไม่มีใครกรอกที่ทำงาน" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {stats.topCompanies.map((c) => (
                  <li key={c.label} className="flex items-center gap-3 py-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{c.label}</span>
                    <span className="text-sm font-bold tabular-nums text-slate-800">{nf.format(c.count)} <span className="text-xs font-normal text-slate-400">คน</span></span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="แต้มสะสมสูงสุด" subtitle="5 อันดับแรก">
            {stats.topContributors.length === 0 ? (
              <Empty text="ยังไม่มีใครได้แต้ม" />
            ) : (
              <ol className="space-y-3">
                {stats.topContributors.map((c, i) => (
                  <li key={c.id}>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="w-5 text-center text-sm">{['🥇', '🥈', '🥉'][i] ?? <span className="text-xs font-bold text-slate-400">{i + 1}</span>}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{c.name}</span>
                      <span className="text-[11px] text-slate-400">{c.generation ?? ''}</span>
                      <span className="w-16 text-right text-xs font-bold tabular-nums text-slate-800">{nf.format(c.points)} แต้ม</span>
                    </div>
                    <div className="ml-7 h-1.5 rounded-[4px] bg-indigo-50">
                      <div className="h-full rounded-[4px] bg-indigo-500" style={{ width: `${(c.points / topPoints) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>

      {/* ── การมีส่วนร่วม ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionTitle icon={Sparkles} title="การมีส่วนร่วม" caption="สะสมทั้งหมด" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile icon={Newspaper} tone="bg-indigo-50 text-indigo-600" label="โพสต์ที่เผยแพร่" value={e.publishedPosts} hint={`ใหม่ ${nf.format(e.postsLast30Days)} ใน 30 วัน`} />
          <StatTile icon={MessageCircle} tone="bg-sky-50 text-sky-600" label="ความคิดเห็น" value={e.comments} hint={`ใหม่ ${nf.format(e.commentsLast30Days)} ใน 30 วัน`} />
          <StatTile icon={Heart} tone="bg-rose-50 text-rose-500" label="ถูกใจโพสต์" value={e.postReactions} hint={`ความคิดเห็น ${nf.format(e.commentReactions)} · หนังสือรุ่น ${nf.format(e.yearbookLikes)}`} />
          <StatTile icon={Vote} tone="bg-amber-50 text-amber-600" label="โหวตโพล" value={e.pollVotes} hint={`โหวต HOF รอบนี้ ${nf.format(e.hofVotesCurrentCampaign)}`} />
        </div>
      </div>

      {/* ── การดูแลเนื้อหา ───────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionTitle icon={ShieldBan} title="การดูแลเนื้อหา" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile icon={Flag} tone="bg-amber-50 text-amber-600" label="รายงานรอตรวจ" value={stats.moderation.pendingReports} />
          <StatTile icon={EyeOff} tone="bg-slate-100 text-slate-500" label="โพสต์ที่ซ่อนอยู่" value={stats.moderation.hiddenPosts} />
          <StatTile icon={EyeOff} tone="bg-slate-100 text-slate-500" label="ความคิดเห็นที่ซ่อนอยู่" value={stats.moderation.hiddenComments} />
          <StatTile icon={ShieldBan} tone="bg-slate-100 text-slate-500" label="คำต้องห้ามในระบบ" value={stats.moderation.bannedKeywords} />
        </div>
        <p className="flex items-center gap-1.5 px-1 text-[11px] text-slate-400">
          <ImageIcon className="h-3.5 w-3.5" /> รูปภาพในระบบทั้งหมด {nf.format(e.photos)} รูป
          <Trophy className="ml-3 h-3.5 w-3.5" /> ข้อมูลทั้งหมดในหน้านี้ดาวน์โหลดเป็น CSV ได้
        </p>
      </div>
    </div>
  );
}
