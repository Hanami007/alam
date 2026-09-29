'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Trophy, Calendar, Users, Vote, Lock, Plus, CheckCircle2,
  ChevronDown, ChevronUp, Clock, RefreshCw, Pencil, Trash2, X, Check,
  Medal, Crown, History, Eye, EyeOff, Copy, AlertTriangle,
} from 'lucide-react';

interface HofResult {
  id: number;
  rank: number;
  name: string;
  avatar_url?: string;
  company?: string;
  position?: string;
  generation?: string;
  achievement?: string;
  total_votes: number;
}

interface HofCampaign {
  id: number;
  title: string;
  status: string;
  cycleNumber: number | null;
  quarter: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  autoCloseAt: string | null;
  finalizedAt: string | null;
  totalVotes: number;
  totalCandidates: number;
  top10: HofResult[];
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-4 w-4 text-amber-500" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-slate-400" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-amber-700" />;
  return <span className="w-4 text-center text-xs font-bold text-slate-500">{rank}</span>;
}

// ─── Sub-component: Top10 Table ───────────────────────────────────────────────
function Top10Table({
  results, campaignFinalized, onDeleteResult, onUpdateResult,
}: {
  results: HofResult[];
  campaignFinalized: boolean;
  onDeleteResult?: (id: number) => void;
  onUpdateResult?: (id: number, data: { rank?: number; achievement?: string }) => void;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAchievement, setEditAchievement] = useState('');

  if (results.length === 0) {
    return (
      <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-400">
        ยังไม่มีผลประกาศ TOP 10 ในรอบนี้
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {results.map((r) => (
        <div key={r.id} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 hover:border-slate-200 transition-all">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50">
            <RankIcon rank={r.rank} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {r.avatar_url && (
                <img src={r.avatar_url} alt={r.name} className="h-7 w-7 rounded-full object-cover" />
              )}
              <p className="font-bold text-slate-900 text-sm">{r.name}</p>
              {r.generation && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                  {r.generation}
                </span>
              )}
              <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                {r.total_votes} โหวต
              </span>
            </div>
            {r.company && (
              <p className="mt-0.5 text-xs text-slate-500 truncate">{r.position}{r.position && r.company ? ' · ' : ''}{r.company}</p>
            )}

            {/* Achievement edit */}
            {editingId === r.id ? (
              <div className="mt-2 flex gap-2">
                <input
                  value={editAchievement}
                  onChange={(e) => setEditAchievement(e.target.value)}
                  className="flex-1 rounded-xl border border-indigo-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="ผลงานดีเด่น..."
                />
                <button
                  onClick={() => {
                    onUpdateResult?.(r.id, { achievement: editAchievement });
                    setEditingId(null);
                  }}
                  className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              r.achievement && (
                <p className="mt-0.5 text-xs text-slate-400 italic truncate">"{r.achievement}"</p>
              )
            )}
          </div>

          {/* Admin controls on finalized result */}
          {campaignFinalized && (
            <div className="flex shrink-0 gap-1">
              <button
                onClick={() => { setEditingId(r.id); setEditAchievement(r.achievement ?? ''); }}
                className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="แก้ไขผลงาน"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => { if (confirm(`ลบ #${r.rank} ${r.name} ออกจาก TOP 10?`)) onDeleteResult?.(r.id); }}
                className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="ลบออกจาก TOP 10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Sub-component: Campaign Card ─────────────────────────────────────────────
function CampaignCard({
  campaign, isLatest, onFinalize, onDeleteResult, onUpdateResult,
}: {
  campaign: HofCampaign;
  isLatest: boolean;
  onFinalize: (id: number) => void;
  onDeleteResult: (resultId: number) => void;
  onUpdateResult: (resultId: number, data: { rank?: number; achievement?: string }) => void;
}) {
  const [expanded, setExpanded] = useState(isLatest);
  const [finalizing, setFinalizing] = useState(false);

  const isFinalized = !!campaign.finalizedAt;
  const isOpen = campaign.status === 'open';

  async function handleFinalize() {
    if (!confirm(`ประกาศผลและบันทึก TOP 10 ของรอบ "${campaign.title}"?\nการกระทำนี้จะ lock ผล แต่แอดมินยังแก้ไขได้ภายหลัง`)) return;
    setFinalizing(true);
    try {
      await onFinalize(campaign.id);
    } finally {
      setFinalizing(false);
    }
  }

  const statusConfig = {
    open: { label: 'เปิดรับโหวต', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    closed: { label: 'ปิดโหวต', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    finalized: { label: 'ประกาศผลแล้ว', bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  };
  const sc = isFinalized ? statusConfig.finalized : statusConfig[campaign.status as 'open' | 'closed'] ?? statusConfig.closed;

  return (
    <div className={`rounded-[24px] border bg-white shadow-xs transition-all ${isLatest ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-slate-200'}`}>
      {/* Card Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left"
      >
        <div className="flex items-center gap-3.5">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isFinalized ? 'bg-indigo-100' : isOpen ? 'bg-emerald-100' : 'bg-slate-100'}`}>
            <Trophy className={`h-5 w-5 ${isFinalized ? 'text-indigo-600' : isOpen ? 'text-emerald-600' : 'text-slate-500'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-extrabold text-slate-900 text-sm">{campaign.title}</p>
              {campaign.cycleNumber && (
                <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                  รอบที่ {campaign.cycleNumber}
                </span>
              )}
              <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${sc.bg} ${sc.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                {sc.label}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              {formatDate(campaign.periodStart)} – {formatDate(campaign.periodEnd)}
              {campaign.totalVotes > 0 && ` · ${campaign.totalVotes.toLocaleString()} โหวต`}
              {campaign.totalCandidates > 0 && ` · ${campaign.totalCandidates} ผู้เข้าชิง`}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-slate-400">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-slate-100 p-5 space-y-4">
          {/* Action buttons */}
          {!isFinalized && campaign.status === 'closed' && (
            <button
              onClick={handleFinalize}
              disabled={finalizing}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-indigo-200 hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
            >
              {finalizing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              ประกาศผลและบันทึก TOP 10
            </button>
          )}

          {isFinalized && (
            <div className="flex items-center gap-2 rounded-2xl bg-indigo-50 px-4 py-2.5">
              <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
              <p className="text-xs font-semibold text-indigo-700">
                ประกาศผลเมื่อ {formatDate(campaign.finalizedAt)}
                {' · '}แอดมินสามารถแก้ไขผลงานหรือลบรายการได้
              </p>
            </div>
          )}

          {/* TOP 10 results */}
          <div>
            <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              {isFinalized ? '🏆 ผลประกาศ TOP 10' : '📊 อันดับปัจจุบัน (Real-time)'}
            </p>
            <Top10Table
              results={campaign.top10}
              campaignFinalized={isFinalized}
              onDeleteResult={onDeleteResult}
              onUpdateResult={onUpdateResult}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-component: New Campaign Form ─────────────────────────────────────────
function NewCampaignForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    quarter: '',
    period_start: '',
    period_end: '',
  });

  function getDefaultDates() {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 90);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }

  function handleOpen() {
    const { start, end } = getDefaultDates();
    const now = new Date();
    const q = `Q${Math.ceil((now.getMonth() + 1) / 3)}/${now.getFullYear() + 543}`;
    setForm({ title: `ศิษย์เก่าดีเด่น ${q}`, quarter: q, period_start: start, period_end: end });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/hof-campaign/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');
      setOpen(false);
      onCreated();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-emerald-200 hover:opacity-90 transition-all cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        สร้างรอบใหม่ (3 เดือน)
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-extrabold text-slate-900">สร้างรอบโหวตใหม่</h3>
              <button onClick={() => setOpen(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">ชื่อแคมเปญ *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="ศิษย์เก่าดีเด่น Q3/2569"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">ป้ายกำกับ (Quarter)</label>
                <input
                  value={form.quarter}
                  onChange={(e) => setForm((f) => ({ ...f, quarter: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Q3/2569"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">วันเริ่ม *</label>
                  <input
                    required type="date"
                    value={form.period_start}
                    onChange={(e) => setForm((f) => ({ ...f, period_start: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">วันสิ้นสุด *</label>
                  <input
                    required type="date"
                    value={form.period_end}
                    onChange={(e) => setForm((f) => ({ ...f, period_end: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
              <div className="rounded-2xl bg-amber-50 p-3.5">
                <p className="text-xs text-amber-800 font-semibold">
                  ⚠️ การสร้างรอบใหม่จะปิด campaign ที่เปิดอยู่โดยอัตโนมัติ
                </p>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs font-extrabold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer transition-all"
                >
                  {loading ? 'กำลังสร้าง...' : 'สร้างรอบใหม่'}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-2xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function HofCampaignManager() {
  const [history, setHistory] = useState<HofCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'current' | 'history'>('current');

  // จัดการ public_api_key เองได้จากตรงนี้ — เดิมมีแค่ข้อความ static บอกให้ไปตั้ง env เอง
  // ทั้งที่ค่าเริ่มต้นในระบบยังเป็น placeholder 'CHANGE_ME_BEFORE_PRODUCTION' ที่ commit ไว้ใน
  // .env.production.example (ใครอ่าน repo ก็รู้ค่าได้) แอดมินควรหมุนคีย์เองได้ทันทีโดยไม่ต้อง
  // รอโปรแกรมเมอร์มาแก้ DB ให้
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyLoading, setApiKeyLoading] = useState(true);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [confirmingRegenerate, setConfirmingRegenerate] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/hof-campaign/history');
      const data = await res.json();
      if (data.success) setHistory(data.history);
    } catch (err) {
      console.error('[HofCampaignManager] load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadApiKey = useCallback(async () => {
    setApiKeyLoading(true);
    try {
      const res = await fetch('/api/admin/public-api-key');
      const data = await res.json();
      setApiKey(data.apiKey || null);
    } catch (err) {
      console.error('[HofCampaignManager] load api key error:', err);
    } finally {
      setApiKeyLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);
  useEffect(() => { loadApiKey(); }, [loadApiKey]);

  async function handleRegenerateApiKey() {
    setRegenerating(true);
    try {
      const res = await fetch('/api/admin/public-api-key', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');
      setApiKey(data.apiKey);
      setApiKeyVisible(true);
      setConfirmingRegenerate(false);
    } catch (err) {
      console.error('[HofCampaignManager] regenerate api key error:', err);
    } finally {
      setRegenerating(false);
    }
  }

  async function handleFinalize(campaignId: number) {
    const res = await fetch('/api/admin/hof-campaign/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: campaignId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');
    await loadHistory();
  }

  async function handleDeleteResult(resultId: number) {
    await fetch(`/api/admin/hof-campaign/results/${resultId}`, { method: 'DELETE' });
    await loadHistory();
  }

  async function handleUpdateResult(resultId: number, body: { rank?: number; achievement?: string }) {
    await fetch(`/api/admin/hof-campaign/results/${resultId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    await loadHistory();
  }

  const current = history.filter((c) => c.status === 'open' || (!c.finalizedAt && c.status === 'closed'));
  const past = history.filter((c) => !!c.finalizedAt);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">HOF Management</p>
          <h2 className="text-lg font-extrabold text-slate-900">จัดการโหวตศิษย์เก่าดีเด่น</h2>
          <p className="text-xs text-slate-500 mt-0.5">รีเซ็ตทุก 3 เดือน — บันทึก TOP 10 ย้อนหลังไว้ตลอด</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => loadHistory()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
            รีเฟรช
          </button>
          <NewCampaignForm onCreated={loadHistory} />
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        {[
          { key: 'current', label: 'รอบปัจจุบัน', icon: Vote },
          { key: 'history', label: `ประวัติทุกรอบ (${past.length})`, icon: History },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setView(key as 'current' | 'history')}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              view === key
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2].map((i) => <div key={i} className="h-24 rounded-[24px] bg-slate-100" />)}
        </div>
      ) : (
        <>
          {view === 'current' && (
            <div className="space-y-4">
              {current.length === 0 ? (
                <div className="rounded-[24px] border-2 border-dashed border-slate-200 p-10 text-center space-y-3">
                  <Trophy className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-500">ยังไม่มี campaign ที่กำลังดำเนินการ</p>
                  <p className="text-xs text-slate-400">กด "สร้างรอบใหม่" เพื่อเริ่มรอบโหวตถัดไป</p>
                </div>
              ) : (
                current.map((c, i) => (
                  <CampaignCard
                    key={c.id}
                    campaign={c}
                    isLatest={i === 0}
                    onFinalize={handleFinalize}
                    onDeleteResult={handleDeleteResult}
                    onUpdateResult={handleUpdateResult}
                  />
                ))
              )}
            </div>
          )}

          {view === 'history' && (
            <div className="space-y-4">
              {past.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-400">
                  ยังไม่มีประวัติการประกาศผล — หลังจากประกาศผลรอบแรกแล้วจะแสดงที่นี่
                </p>
              ) : (
                past.map((c, i) => (
                  <CampaignCard
                    key={c.id}
                    campaign={c}
                    isLatest={i === 0}
                    onFinalize={handleFinalize}
                    onDeleteResult={handleDeleteResult}
                    onUpdateResult={handleUpdateResult}
                  />
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* API Info */}
      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <p className="text-xs font-bold text-slate-700">Public API สำหรับเว็บภายนอก</p>
        </div>
        <div className="space-y-1">
          <code className="block text-[11px] text-slate-600 bg-white rounded-xl px-3 py-1.5 border border-slate-200">
            GET /api/public/hof/top10?api_key=YOUR_KEY
          </code>
          <code className="block text-[11px] text-slate-600 bg-white rounded-xl px-3 py-1.5 border border-slate-200">
            GET /api/public/hof/history?api_key=YOUR_KEY
          </code>
        </div>

        {/* คีย์ปัจจุบัน + ปุ่มหมุนคีย์เอง — แทนที่ข้อความ static เดิมที่บอกให้ไปแก้ .env เอง */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">API Key ปัจจุบัน</p>
          {apiKeyLoading ? (
            <p className="text-xs text-slate-400">กำลังโหลด...</p>
          ) : (
            <div className="flex items-center gap-2">
              <code className="flex-1 min-w-0 truncate text-[11px] text-slate-700 bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100 font-mono">
                {apiKeyVisible ? (apiKey || 'ยังไม่มีคีย์') : apiKey ? '•'.repeat(24) : 'ยังไม่มีคีย์'}
              </code>
              {apiKey && (
                <>
                  <button
                    onClick={() => setApiKeyVisible((v) => !v)}
                    title={apiKeyVisible ? 'ซ่อนคีย์' : 'แสดงคีย์'}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {apiKeyVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => navigator.clipboard?.writeText(apiKey)}
                    title="คัดลอกคีย์"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          )}
          {apiKey === 'CHANGE_ME_BEFORE_PRODUCTION' && (
            <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 font-semibold">
                นี่คือคีย์ default ที่ใครอ่านโค้ดต้นทางก็รู้ค่าได้ ยังไม่ปลอดภัย กดหมุนคีย์ใหม่ก่อนเปิดให้เว็บภายนอกใช้งานจริง
              </p>
            </div>
          )}

          {confirmingRegenerate ? (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2">
              <span className="text-[11px] font-bold text-rose-700 flex-1">
                คีย์เก่าจะใช้ไม่ได้ทันที เว็บภายนอกที่ใช้คีย์เดิมอยู่จะเรียก API ไม่ผ่านจนกว่าจะอัปเดตคีย์ใหม่
              </span>
              <button
                onClick={handleRegenerateApiKey}
                disabled={regenerating}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-extrabold text-white hover:bg-rose-700 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                {regenerating ? 'กำลังหมุน...' : 'ยืนยันหมุนคีย์'}
              </button>
              <button
                onClick={() => setConfirmingRegenerate(false)}
                disabled={regenerating}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                ยกเลิก
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingRegenerate(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              หมุนคีย์ใหม่
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
