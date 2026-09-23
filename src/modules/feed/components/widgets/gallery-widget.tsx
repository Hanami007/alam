'use client';

import Link from 'next/link';
import { Image as ImageIcon } from 'lucide-react';

interface GalleryPhoto {
  id: number | string;
  title?: string;
  caption?: string;
}

interface GalleryWidgetProps {
  latestPhotos: GalleryPhoto[];
}

export function GalleryWidget({ latestPhotos }: GalleryWidgetProps) {
  return (
    <div className="rounded-[26px] border border-purple-200/70 bg-white p-4.5 shadow-card transition-all duration-200">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <ImageIcon className="h-4 w-4 text-purple-400" />
          <span>คลังภาพกิจกรรม</span>
        </h3>
        <Link href="/gallery" className="text-xs font-medium text-pink-500 hover:underline">
          ดูทั้งหมด
        </Link>
      </div>
      <div className="mt-2.5 space-y-2">
        {latestPhotos.length === 0 ? (
          <p className="text-xs text-slate-400 py-2 text-center">ไม่มีรูปภาพล่าสุด</p>
        ) : (
          latestPhotos.slice(0, 2).map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-purple-50/30 border border-purple-50 p-2 hover:bg-purple-50 transition-colors">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <ImageIcon className="h-3.5 w-3.5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-700 truncate">{item.title || 'รูปกิจกรรม'}</p>
                <p className="text-xs text-slate-400">{item.caption || 'คลังภาพศิษย์เก่า'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
