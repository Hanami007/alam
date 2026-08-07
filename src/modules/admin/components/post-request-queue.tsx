// เพิ่ม component นี้เข้าไปใน admin-dashboard.tsx เดิม (import แล้ววางในหน้า)
// ต้องดึง postRequests มาจาก getPostRequests() ใน page.tsx แล้วส่งเป็น prop เข้ามา

'use client';
import { useState } from 'react';

interface PostRequest {
  id: number;
  title: string;
  content: string;
  category: string;
  requester_name: string;
  created_at: string;
}

interface PostRequestQueueProps {
  requests: PostRequest[];
  adminId: number;
}

export function PostRequestQueue({ requests: initialRequests, adminId }: PostRequestQueueProps) {
  const [requests, setRequests] = useState(initialRequests);

  async function handleDecision(postId: number, action: 'approve' | 'reject') {
    await fetch(`/api/admin/post-requests/${postId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, adminId }),
    });
    setRequests((prev) => prev.filter((r) => r.id !== postId));
  }

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">คำขอสร้างโพสต์ ({requests.length})</h3>
      <div className="mt-4 space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-900">{r.title}</p>
              <span className="text-xs text-slate-400">{r.category}</span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{r.content}</p>
            <p className="mt-2 text-xs text-slate-400">ร้องขอโดย {r.requester_name} · {new Date(r.created_at).toLocaleDateString('th-TH')}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => handleDecision(r.id, 'approve')} className="btn-primary text-sm">อนุมัติ</button>
              <button onClick={() => handleDecision(r.id, 'reject')} className="btn-secondary text-sm">ปฏิเสธ</button>
            </div>
          </div>
        ))}
        {requests.length === 0 && <p className="text-sm text-slate-400">ไม่มีคำขอค้างอยู่</p>}
      </div>
    </div>
  );
}