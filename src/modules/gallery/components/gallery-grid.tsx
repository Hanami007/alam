'use client';
import { useState } from 'react';

interface GalleryItem {
  id: number;
  title: string;
  generation: string;
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
  allUsers: { id: number; name: string }[]; // สำหรับ autocomplete ตอนแท็ก
}

export function GalleryGrid({ items: initialItems = [], currentUserId, allUsers = [] }: GalleryGridProps) {
  const [items, setItems] = useState(initialItems);
  const [answering, setAnswering] = useState<number | null>(null);
  const [answer, setAnswer] = useState('');
  const [tagging, setTagging] = useState<number | null>(null);
  const [tagQuery, setTagQuery] = useState('');

  async function handleUnlock(assetId: number) {
    const res = await fetch('/api/gallery/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, assetId, answer }),
    });
    const data = await res.json();
    if (data.success) {
      setItems((prev) => prev.map((it) => (it.id === assetId ? { ...it, locked: false } : it)));
    }
    setAnswering(null);
    setAnswer('');
  }

  async function handleTag(assetId: number, taggedUserId: number, taggedUserName: string) {
    const res = await fetch('/api/gallery/tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaAssetId: assetId, taggedUserId, currentUserId }),
    });
    if (res.ok) {
      setItems((prev) =>
        prev.map((it) => (it.id === assetId ? { ...it, tags: [...it.tags, taggedUserName] } : it))
      );
    }
    setTagging(null);
    setTagQuery('');
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
            <img
              src={item.locked ? item.image : item.original_image}
              alt={item.title}
              className={`h-full w-full object-cover ${item.locked ? 'blur-md' : ''}`}
            />
          </div>
          <p className="mt-3 font-medium text-slate-900">{item.title}</p>
          <p className="text-sm text-slate-500">{item.generation}</p>

          {item.locked ? (
            answering === item.id ? (
              <div className="mt-3 space-y-2">
                <p className="text-sm text-slate-700">{item.unlock_question}</p>
                <input
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="input-base w-full"
                  placeholder="คำตอบของคุณ"
                />
                <button onClick={() => handleUnlock(item.id)} className="btn-primary text-sm">
                  ส่งคำตอบ (ได้ {item.points_for_unlock} คะแนน)
                </button>
              </div>
            ) : (
              <button onClick={() => setAnswering(item.id)} className="btn-secondary mt-3 text-sm">
                ตอบคำถามเพื่อปลดล็อก
              </button>
            )
          ) : (
            <div className="mt-3 space-y-2">
              {item.tags.length > 0 && (
                <p className="text-sm text-slate-500">แท็ก: {item.tags.join(', ')}</p>
              )}
              {tagging === item.id ? (
                <div className="space-y-1">
                  <input
                    value={tagQuery}
                    onChange={(e) => setTagQuery(e.target.value)}
                    placeholder="พิมพ์ชื่อเพื่อน..."
                    className="input-base w-full"
                  />
                  <div className="max-h-32 overflow-y-auto rounded-xl border border-slate-100">
                    {allUsers
                      .filter((u) => u.name.toLowerCase().includes(tagQuery.toLowerCase()) && tagQuery.length > 0)
                      .slice(0, 5)
                      .map((u) => (
                        <button
                          key={u.id}
                          onClick={() => handleTag(item.id, u.id, u.name)}
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                        >
                          {u.name}
                        </button>
                      ))}
                  </div>
                </div>
              ) : (
                <button onClick={() => setTagging(item.id)} className="text-sm font-medium text-blue-600">
                  + แท็กเพื่อนในรูปนี้
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}