'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Images, Loader2, Lock, Tag, Unlock, UserRound, X } from 'lucide-react';
import { ModalPortal } from '@/components/ui/modal-portal';

/**
 * แท็บ "อัลบั้มของฉัน" ในหน้าโปรไฟล์ (เจ้าของเท่านั้น) — ข้อมูลจาก GET /api/user/photos
 * 1. รูปที่รอฉันยอมรับ (มีคนแท็ก)  2. รูปทำเนียบของฉัน (หาจาก NAS อัตโนมัติ)
 * 3. รูปที่มีฉัน (แท็กที่ยอมรับแล้ว)  4. รุ่นที่ปลดล็อกคลังภาพแล้ว
 */

interface AlbumPhoto {
  tagId: number;
  path: string;
  imageUrl: string;
  generation: string | null;
  folder: string;
  taggedByName: string | null;
  createdAt: string;
}

interface AlbumData {
  portrait: { path: string; imageUrl: string } | null;
  taggedPhotos: AlbumPhoto[];
  pendingTags: AlbumPhoto[];
  unlockedGenerations: string[];
}

function photoCaption(p: AlbumPhoto) {
  return [p.generation, p.folder].filter(Boolean).join(' · ') || 'รูปคลังภาพเก่า';
}

function Section({ icon: Icon, title, subtitle, children }: { icon: typeof Tag; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function MyAlbum({ onCountsChange }: { onCountsChange?: (tagged: number, unlocked: number) => void }) {
  const [data, setData] = useState<AlbumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyTagId, setBusyTagId] = useState<number | null>(null);
  const [viewing, setViewing] = useState<{ imageUrl: string; caption: string; tag?: AlbumPhoto } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/user/photos');
      const json = await res.json();
      setData(json);
      onCountsChange?.(json.taggedPhotos?.length ?? 0, json.unlockedGenerations?.length ?? 0);
    } catch {
      setError('โหลดอัลบั้มไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [onCountsChange]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- โหลดอัลบั้มเมื่อเปิดแท็บ
    load();
  }, [load]);

  async function respond(tag: AlbumPhoto, action: 'accept' | 'decline') {
    setBusyTagId(tag.tagId);
    setError(null);
    try {
      const res = await fetch('/api/gallery/photo-tags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tag.tagId, action }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'บันทึกไม่สำเร็จ');
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyTagId(null);
    }
  }

  async function removeTag(tag: AlbumPhoto) {
    if (!window.confirm('เอาแท็กของคุณออกจากรูปนี้?')) return;
    setBusyTagId(tag.tagId);
    try {
      const res = await fetch(`/api/gallery/photo-tags?id=${tag.tagId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'ลบแท็กไม่สำเร็จ');
      setViewing(null);
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyTagId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-3xl border border-slate-200/80 bg-white p-12 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลดอัลบั้ม...
      </div>
    );
  }
  if (!data) return <p className="rounded-3xl bg-rose-50 p-6 text-sm text-rose-600">{error || 'โหลดอัลบั้มไม่สำเร็จ'}</p>;

  return (
    <div className="space-y-5 animate-fade-in">
      {error && <p className="rounded-2xl bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-600">{error}</p>}

      {/* 1. รอยอมรับ */}
      {data.pendingTags.length > 0 && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5 sm:p-6">
          <h3 className="flex items-center gap-2 text-sm font-bold text-amber-900">
            <Tag className="h-4 w-4" /> มีคนแท็กคุณ {data.pendingTags.length} รูป — ยืนยันว่าเป็นคุณไหม?
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.pendingTags.map((p) => (
              <div key={p.tagId} className="flex gap-3 rounded-2xl border border-amber-100 bg-white p-3">
                <button type="button" onClick={() => setViewing({ imageUrl: p.imageUrl, caption: photoCaption(p) })} className="shrink-0">
                  <img src={p.imageUrl} alt={photoCaption(p)} className="h-20 w-16 rounded-lg object-cover bg-slate-100" />
                </button>
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <p className="truncate text-xs font-semibold text-slate-700">{photoCaption(p)}</p>
                    <p className="text-[11px] text-slate-500">แท็กโดย {p.taggedByName ?? 'สมาชิก'}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={busyTagId === p.tagId}
                      onClick={() => respond(p, 'accept')}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-500 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" /> ใช่ ฉันเอง
                    </button>
                    <button
                      type="button"
                      disabled={busyTagId === p.tagId}
                      onClick={() => respond(p, 'decline')}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" /> ไม่ใช่
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,260px)_1fr]">
        {/* 2. รูปทำเนียบ */}
        <Section icon={UserRound} title="รูปทำเนียบของฉัน" subtitle="หาจากคลังภาพอัตโนมัติด้วยรหัสนักศึกษา">
          {data.portrait ? (
            <button
              type="button"
              onClick={() => setViewing({ imageUrl: data.portrait!.imageUrl, caption: 'รูปทำเนียบของฉัน' })}
              className="block w-full overflow-hidden rounded-2xl bg-slate-100"
            >
              <img src={data.portrait.imageUrl} alt="รูปทำเนียบของฉัน" className="aspect-[3/4] w-full object-cover transition-transform hover:scale-[1.02]" />
            </button>
          ) : (
            <p className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-xs text-slate-400">
              ยังไม่พบรูปทำเนียบของคุณในคลังภาพ
            </p>
          )}
        </Section>

        {/* 3. รูปที่มีฉัน */}
        <Section icon={Images} title={`รูปที่มีคุณ (${data.taggedPhotos.length})`} subtitle="รูปจากคลังภาพเก่าที่คุณหรือเพื่อนแท็กไว้">
          {data.taggedPhotos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center">
              <p className="text-sm font-semibold text-slate-600">ยังไม่มีรูปที่แท็กคุณ</p>
              <p className="mt-1 text-xs text-slate-400">เปิดรูปในคลังภาพเก่าแล้วกด &ldquo;🙋 นี่คือฉัน&rdquo; หรือให้เพื่อนแท็กคุณ</p>
              <Link href="/gallery" className="mt-3 inline-block text-xs font-bold text-indigo-600 hover:underline">ไปที่คลังภาพเก่า →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {data.taggedPhotos.map((p) => (
                <button
                  key={p.tagId}
                  type="button"
                  onClick={() => setViewing({ imageUrl: p.imageUrl, caption: photoCaption(p), tag: p })}
                  className="group overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 text-left"
                >
                  <img src={p.imageUrl} alt={photoCaption(p)} className="aspect-[3/4] w-full object-cover transition-transform group-hover:scale-[1.03]" />
                  <p className="truncate px-2.5 py-1.5 text-[11px] font-medium text-slate-600">{photoCaption(p)}</p>
                </button>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* 4. รุ่นที่ปลดล็อก */}
      <Section icon={Unlock} title="คลังภาพที่ปลดล็อกแล้ว" subtitle="ตอบคำถามประจำรุ่นถูกแล้ว ดูรูปและแท็กคนในรูปได้">
        {data.unlockedGenerations.length === 0 ? (
          <p className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-4 text-xs text-slate-500">
            <Lock className="h-4 w-4" /> ยังไม่ได้ปลดล็อกรุ่นไหน — ไปตอบคำถามที่ <Link href="/gallery" className="font-bold text-indigo-600 hover:underline">คลังภาพเก่า</Link>
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.unlockedGenerations.map((g) => (
              <Link
                key={g}
                href="/gallery"
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
              >
                <Unlock className="h-3.5 w-3.5" /> {g}
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* ดูรูปใหญ่ */}
      {viewing && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" onClick={() => setViewing(null)}>
            <div className="relative w-full max-w-2xl rounded-3xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow hover:bg-white"
              >
                <X className="h-4 w-4" />
              </button>
              <img src={viewing.imageUrl} alt={viewing.caption} className="max-h-[70vh] w-full rounded-2xl object-contain bg-slate-100" />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
                <div>
                  <p className="text-sm font-bold text-slate-800">{viewing.caption}</p>
                  {viewing.tag?.taggedByName && <p className="text-xs text-slate-500">แท็กโดย {viewing.tag.taggedByName}</p>}
                </div>
                {viewing.tag && (
                  <button
                    type="button"
                    disabled={busyTagId === viewing.tag.tagId}
                    onClick={() => removeTag(viewing.tag!)}
                    className="rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  >
                    เอาแท็กออก
                  </button>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
