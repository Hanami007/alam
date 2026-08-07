'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ImageIcon, Heart, MessageCircle } from 'lucide-react';

interface FeedListProps {
  posts: any[];
  stats: any;
  latestPhotos?: any[];
  featuredAlumni?: any[];
  currentUserId: number;
}

export function FeedList({ posts = [], stats, latestPhotos = [], featuredAlumni = [], currentUserId }: FeedListProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      await fetch('/api/feed/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestedBy: currentUserId, title, content, category }),
      });
      setTitle('');
      setContent('');
      setCategory('');
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
      {/* คอลัมน์หลัก: ร้องขอโพสต์ + วอลล์ */}
      <div className="space-y-4">
        <form onSubmit={handleSubmitRequest} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">ร้องขอสร้างโพสต์</h3>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="หัวข้อโพสต์"
            className="input-base w-full"
          />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="หมวดหมู่ (เช่น ประกาศ, ขอความช่วยเหลือ)"
            className="input-base w-full"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="รายละเอียดที่อยากให้แอดมินโพสต์ให้..."
            rows={3}
            className="input-base w-full"
          />
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'กำลังส่ง...' : 'ส่งคำขอให้แอดมิน'}
          </button>
          {sent && <p className="text-sm text-emerald-600">ส่งคำขอแล้ว รอแอดมินพิจารณา</p>}
        </form>

        {posts.map((post) => (
          <div key={post.id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">{post.title}</p>
              {post.pinned && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">ปักหมุด</span>}
            </div>
            <p className="mt-2 text-sm leading-7 text-slate-600">{post.body}</p>
            <p className="mt-3 text-sm text-slate-500">{post.author} · {new Date(post.created_at).toLocaleDateString('th-TH')}</p>
            <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><Heart className="h-4 w-4" /> {post.likes}</span>
              <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" /> {post.comments}</span>
            </div>
            {post.poll && (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-900">{post.poll.question}</p>
                <div className="mt-2 space-y-2">
                  {post.poll.options.map((opt: any) => (
                    <div key={opt.id} className="flex items-center justify-between text-sm text-slate-600">
                      <span>{opt.text}</span>
                      <span>{opt.votes} โหวต</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sidebar: รวม dashboard เดิม */}
      <aside className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">ศิษย์เก่า</p>
            <p className="text-xl font-semibold text-slate-900">{stats?.totalAlumni ?? stats?.approvedUsers ?? '-'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">ศิษย์เก่าดีเด่น</p>
            <p className="text-xl font-semibold text-slate-900">{stats?.outstandingAlumni ?? '-'}</p>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">รูปล่าสุด</h3>
            <Link href="/gallery" className="text-xs font-medium text-blue-600">ดูทั้งหมด</Link>
          </div>
          <div className="mt-3 space-y-2">
            {latestPhotos.slice(0, 2).map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <p className="text-sm text-slate-700">{item.title}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">ศิษย์เก่าแนะนำ</h3>
            <Link href="/hall-of-fame" className="text-xs font-medium text-blue-600">ดูทั้งหมด</Link>
          </div>
          <div className="mt-3 space-y-2">
            {featuredAlumni.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-center gap-3">
                <img src={a.image} alt={a.name} className="h-8 w-8 rounded-full object-cover" />
                <p className="text-sm text-slate-700">{a.name}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
} 