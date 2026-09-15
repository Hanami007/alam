'use client';
import { useState } from 'react';
import { Trash2, Loader2, BarChart2, FileText } from 'lucide-react';

interface PollPreview {
  id: number;
  question: string;
  pointsPerVote: number;
  options: { id: number; text: string }[];
}

interface PostRequest {
  id: number;
  title: string;
  content: string;
  category: string;
  post_type?: 'normal' | 'poll';
  requester_name: string;
  created_at: string;
  poll?: PollPreview;
}

interface PostRequestQueueProps {
  requests: PostRequest[];
  adminId: number;
  onRefresh?: () => void;
}

export function PostRequestQueue({ requests = [], adminId = 1, onRefresh }: PostRequestQueueProps) {
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const visibleRequests = requests.filter((r) => !dismissedIds.includes(r.id));

  async function handleDelete(postId: number) {
    if (!confirm('ต้องการลบโพสต์นี้ออกจากวอลล์?')) return;
    setDeletingId(postId);
    try {
      const res = await fetch(`/api/feed/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, adminId }),
      });
      const data = await res.json();
      if (data.success) {
        setDismissedIds((prev) => [...prev, postId]);
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการลบ');
      }
    } catch (err: any) {
      console.error('Error deleting post:', err);
      alert('เกิดข้อผิดพลาดในการส่งข้อมูล');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">โพสต์บนวอลล์</p>
          <h3 className="text-lg font-bold text-slate-900">จัดการโพสต์ที่เผยแพร่แล้ว</h3>
          <p className="text-xs text-slate-400 mt-0.5">โพสต์ทั้งหมดถูกเผยแพร่อัตโนมัติหลังผ่านตัวกรอง แอดมินสามารถลบได้ที่นี่</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600 border border-indigo-100">
          {visibleRequests.length} รายการ
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {visibleRequests.map((r) => (
          <div key={r.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-3 transition-all hover:border-indigo-100 hover:bg-white">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {r.post_type === 'poll' ? (
                    <BarChart2 className="h-4 w-4 text-purple-500 shrink-0" />
                  ) : (
                    <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                  )}
                  <h4 className="font-bold text-slate-900 text-base truncate">{r.title}</h4>
                  {r.post_type === 'poll' && (
                    <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-extrabold text-purple-700 border border-purple-200">
                      📊 โพลแบบสำรวจ
                    </span>
                  )}
                  {r.category && (
                    <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                      {r.category}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  โดย <span className="font-semibold text-slate-700">{r.requester_name}</span> · {new Date(r.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              {/* Delete button */}
              <button
                type="button"
                disabled={deletingId === r.id}
                onClick={() => handleDelete(r.id)}
                title="ลบโพสต์นี้"
                className="shrink-0 flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deletingId === r.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                ลบ
              </button>
            </div>

            {/* Normal content */}
            {r.content && r.post_type !== 'poll' && (
              <p className="text-sm text-slate-600 whitespace-pre-line bg-white/90 rounded-xl p-3 border border-slate-100 line-clamp-3">
                {r.content}
              </p>
            )}

            {/* Poll details */}
            {r.poll && (
              <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-purple-800">คำถาม: {r.poll.question}</p>
                  <span className="text-[11px] font-bold text-purple-600 bg-white px-2 py-0.5 rounded-full border border-purple-200">
                    +{r.poll.pointsPerVote} แต้ม
                  </span>
                </div>
                <div className="space-y-1.5 pl-2">
                  {r.poll.options.map((opt, idx) => (
                    <div key={opt.id || idx} className="text-xs text-slate-700 flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-purple-100/80">
                      <span className="text-purple-500 font-bold">{idx + 1}.</span>
                      <span>{opt.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {visibleRequests.length === 0 && (
          <p className="text-center text-xs text-slate-400 py-6">ไม่มีโพสต์ในระบบขณะนี้</p>
        )}
      </div>
    </div>
  );
}