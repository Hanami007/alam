'use client';

import Link from 'next/link';
import { Image as ImageIcon, Lock, Unlock } from 'lucide-react';

interface GalleryWidgetProps {
  /** รุ่นที่ปลดล็อกคลังภาพแล้ว เช่น ["รุ่น 28"] (จาก /api/gallery/unlocked-generations) */
  unlockedGenerations: string[];
  /** รุ่นของผู้ใช้เอง — ใช้ชวนไปปลดล็อกรุ่นตัวเองถ้ายังไม่ได้ปลดล็อก */
  userGeneration?: string | null;
}

/**
 * วิดเจ็ตคลังภาพเก่าในหน้าฟีด — แสดงรุ่นที่ปลดล็อกแล้ว (อ่านจาก DB อย่างเดียว ไม่รอ NAS)
 * เดิมอ่านจาก media_assets ซึ่งไม่มีหน้าไหนให้อัปโหลดรูปลงไป จึงเห็นได้แค่รูปตัวอย่าง
 */
export function GalleryWidget({ unlockedGenerations, userGeneration }: GalleryWidgetProps) {
  const shown = unlockedGenerations.slice(0, 3);
  const ownLocked = userGeneration && !unlockedGenerations.includes(userGeneration);

  return (
    <div className="rounded-[26px] border border-purple-200/70 bg-white p-4.5 shadow-card transition-all duration-200">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <ImageIcon className="h-4 w-4 text-purple-400" />
          <span>คลังภาพเก่า</span>
        </h3>
        <Link href="/gallery" className="text-xs font-medium text-pink-500 hover:underline">
          ดูทั้งหมด
        </Link>
      </div>
      <div className="mt-2.5 space-y-2">
        {shown.map((gen) => (
          <Link
            key={gen}
            href="/gallery"
            className="flex items-center gap-3 rounded-2xl bg-purple-50/30 border border-purple-50 p-2 hover:bg-purple-50 transition-colors"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <Unlock className="h-3.5 w-3.5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-700 truncate">{gen}</p>
              <p className="text-xs text-slate-400">ปลดล็อกแล้ว ดูรูปได้</p>
            </div>
          </Link>
        ))}

        {ownLocked && (
          <Link
            href="/gallery"
            className="flex items-center gap-3 rounded-2xl border border-dashed border-purple-200 p-2 hover:bg-purple-50/50 transition-colors"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <Lock className="h-3.5 w-3.5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-700 truncate">{userGeneration} ของคุณ</p>
              <p className="text-xs text-slate-400">ตอบคำถามประจำรุ่นเพื่อดูรูป</p>
            </div>
          </Link>
        )}

        {shown.length === 0 && !ownLocked && (
          <p className="text-xs text-slate-400 py-2 text-center">ยังไม่ได้ปลดล็อกคลังภาพรุ่นไหน</p>
        )}
      </div>
    </div>
  );
}
