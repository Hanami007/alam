'use client';
import { useState } from 'react';
import { Lock, Unlock, Tag, ImageIcon, CheckCircle2, AlertCircle, Search, X } from 'lucide-react';

interface GalleryItem {
  id: number;
  title: string;
  generation: string;
  year?: number;
  image: string;
  original_image: string;
  locked: boolean;
  unlock_question: string;
  points_for_unlock: number;
  tags: string[];
}

interface GalleryGridProps {
  items: GalleryItem[];
  currentUserId: number;
  allUsers: { id: number; name: string }[];
}

type UnlockStatus = 'idle' | 'submitting' | 'success' | 'error';

export function GalleryGrid({ items: initialItems = [], currentUserId, allUsers = [] }: GalleryGridProps) {
  const [items, setItems] = useState(initialItems);

  // Unlock state
  const [answering, setAnswering] = useState<number | null>(null);
  const [answer, setAnswer] = useState('');
  const [unlockStatus, setUnlockStatus] = useState<Record<number, UnlockStatus>>({});

  // Tag state
  const [tagging, setTagging] = useState<number | null>(null);
  const [tagQuery, setTagQuery] = useState('');
  const [tagStatus, setTagStatus] = useState<Record<number, 'idle' | 'success' | 'error'>>({});

  // Lightbox
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  async function handleUnlock(assetId: number) {
    if (!answer.trim()) return;
    setUnlockStatus((s) => ({ ...s, [assetId]: 'submitting' }));

    const res = await fetch('/api/gallery/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, assetId, answer }),
    });
    const data = await res.json();

    if (data.success) {
      setUnlockStatus((s) => ({ ...s, [assetId]: 'success' }));
      setItems((prev) => prev.map((it) => (it.id === assetId ? { ...it, locked: false } : it)));
      setTimeout(() => {
        setAnswering(null);
        setAnswer('');
        setUnlockStatus((s) => ({ ...s, [assetId]: 'idle' }));
      }, 1500);
    } else {
      setUnlockStatus((s) => ({ ...s, [assetId]: 'error' }));
      setTimeout(() => setUnlockStatus((s) => ({ ...s, [assetId]: 'idle' })), 3000);
    }
  }

  async function handleTag(assetId: number, taggedUserId: number, taggedUserName: string) {
    const res = await fetch('/api/gallery/tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaAssetId: assetId, taggedUserId, currentUserId }),
    });
    const data = await res.json();

    if (res.ok && data.success) {
      setTagStatus((s) => ({ ...s, [assetId]: 'success' }));
      setItems((prev) =>
        prev.map((it) => (it.id === assetId ? { ...it, tags: [...it.tags, taggedUserName] } : it))
      );
    } else {
      setTagStatus((s) => ({ ...s, [assetId]: 'error' }));
    }
    setTagging(null);
    setTagQuery('');
    setTimeout(() => setTagStatus((s) => ({ ...s, [assetId]: 'idle' })), 3000);
  }

  const filteredSuggestions = allUsers
    .filter((u) => u.name.toLowerCase().includes(tagQuery.toLowerCase()) && tagQuery.length > 0)
    .slice(0, 6);

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={lightbox.original_image || lightbox.image}
              alt={lightbox.title}
              className="w-full rounded-3xl shadow-2xl"
            />
            <div className="mt-3 flex items-center justify-between px-1">
              <div>
                <p className="text-sm font-semibold text-white">{lightbox.title}</p>
                <p className="text-xs text-white/60">{lightbox.generation}</p>
              </div>
              {lightbox.tags.length > 0 && (
                <p className="text-xs text-white/60">แท็ก: {lightbox.tags.join(', ')}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 && (
          <div className="col-span-full rounded-[28px] border border-slate-100 bg-white p-16 text-center">
            <ImageIcon className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-400">ยังไม่มีรูปภาพในคลังภาพ</p>
          </div>
        )}

        {items.map((item) => {
          const uStatus = unlockStatus[item.id] ?? 'idle';
          const tStatus = tagStatus[item.id] ?? 'idle';

          return (
            <div
              key={item.id}
              className="rounded-[28px] border border-slate-200/90 bg-white shadow-card overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              {/* Image */}
              <div
                className={`relative aspect-[4/3] overflow-hidden bg-slate-100 ${!item.locked ? 'cursor-zoom-in' : ''}`}
                onClick={() => !item.locked && setLightbox(item)}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className={`h-full w-full object-cover transition-all duration-300 ${item.locked ? 'blur-lg scale-105 brightness-75' : 'hover:scale-105'}`}
                />
                {/* Locked overlay */}
                {item.locked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
                      <Lock className="h-5 w-5 text-white" />
                    </div>
                    <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      ปลดล็อกเพื่อดูรูปจริง
                    </span>
                  </div>
                )}
                {/* Unlocked badge */}
                {!item.locked && (
                  <div className="absolute top-2.5 right-2.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                      <Unlock className="h-3 w-3" /> ปลดล็อกแล้ว
                    </span>
                  </div>
                )}
                {/* Generation badge */}
                {item.generation && (
                  <div className="absolute bottom-2.5 left-2.5">
                    <span className="rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      {item.generation}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="font-semibold text-slate-900 truncate">{item.title || 'รูปกิจกรรม'}</p>

                {/* Tags row */}
                {item.tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {item.tags.slice(0, 4).map((tag, i) => (
                      <span key={i} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 border border-indigo-100">
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 4 && (
                      <span className="text-xs text-slate-400">+{item.tags.length - 4}</span>
                    )}
                  </div>
                )}

                {/* Tag success/error feedback */}
                {tStatus === 'success' && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> แท็กเพื่อนแล้ว!
                  </p>
                )}
                {tStatus === 'error' && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-500">
                    <AlertCircle className="h-3.5 w-3.5" /> ต้องปลดล็อกก่อนแท็กได้
                  </p>
                )}

                {/* ─── LOCKED: Unlock Form ─── */}
                {item.locked && (
                  <div className="mt-3">
                    {answering === item.id ? (
                      <div className="space-y-2.5 rounded-2xl border border-amber-100 bg-amber-50/50 p-3">
                        <p className="text-xs font-semibold text-amber-800">❓ {item.unlock_question}</p>
                        <input
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleUnlock(item.id)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
                          placeholder="คำตอบของคุณ..."
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setAnswering(null); setAnswer(''); setUnlockStatus((s) => ({ ...s, [item.id]: 'idle' })); }}
                            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                          >
                            ยกเลิก
                          </button>
                          <button
                            onClick={() => handleUnlock(item.id)}
                            disabled={!answer.trim() || uStatus === 'submitting'}
                            className={`flex-1 flex items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-bold transition-all disabled:opacity-40 ${
                              uStatus === 'success'
                                ? 'bg-emerald-500 text-white'
                                : uStatus === 'error'
                                ? 'bg-rose-500 text-white'
                                : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white hover:opacity-90'
                            }`}
                          >
                            {uStatus === 'submitting' ? (
                              <><span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" /> กำลังส่ง...</>
                            ) : uStatus === 'success' ? (
                              <><CheckCircle2 className="h-3.5 w-3.5" /> ปลดล็อกแล้ว! +{item.points_for_unlock} คะแนน</>
                            ) : uStatus === 'error' ? (
                              '⚠️ เกิดข้อผิดพลาด'
                            ) : (
                              `ส่งคำตอบ (+${item.points_for_unlock} คะแนน)`
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAnswering(item.id)}
                        className="w-full rounded-2xl border border-amber-200 bg-amber-50 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        ตอบคำถามเพื่อปลดล็อก (+{item.points_for_unlock} คะแนน)
                      </button>
                    )}
                  </div>
                )}

                {/* ─── UNLOCKED: Tag Feature ─── */}
                {!item.locked && (
                  <div className="mt-3">
                    {tagging === item.id ? (
                      <div className="space-y-2 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3">
                        <p className="text-xs font-semibold text-indigo-800 flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5" /> แท็กเพื่อนในรูปนี้
                        </p>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          <input
                            value={tagQuery}
                            onChange={(e) => setTagQuery(e.target.value)}
                            placeholder="พิมพ์ชื่อเพื่อน..."
                            autoFocus
                            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          />
                        </div>
                        {filteredSuggestions.length > 0 && (
                          <div className="max-h-32 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-sm">
                            {filteredSuggestions.map((u) => (
                              <button
                                key={u.id}
                                onClick={() => handleTag(item.id, u.id, u.name)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-indigo-50 transition-colors"
                              >
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">
                                  {u.name.substring(0, 1)}
                                </div>
                                {u.name}
                              </button>
                            ))}
                          </div>
                        )}
                        {tagQuery.length > 0 && filteredSuggestions.length === 0 && (
                          <p className="text-xs text-slate-400 text-center py-1">ไม่พบชื่อที่ค้นหา</p>
                        )}
                        <button
                          onClick={() => { setTagging(null); setTagQuery(''); }}
                          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          ✕ ยกเลิก
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setTagging(item.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <Tag className="h-3.5 w-3.5" />
                        แท็กเพื่อนในรูปนี้
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}