'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ModalPortal } from '@/components/ui/modal-portal';

/**
 * รูปในการ์ดโพสต์ — จัดวางตามจำนวน: 1 รูปเต็ม / 2 รูปคู่ / 3 รูป (ใหญ่ 1 + เล็ก 2) / 4 รูป 2×2
 * ความสูงรวมจำกัดไว้ ~300–400px ไม่ว่ากี่รูป (ครอปให้พอดีช่อง กดดูรูปเต็มได้)
 * — เดิมใช้จัตุรัสเต็มความกว้างการ์ด 4 รูปสูงเกือบ 600px
 * กดรูปเพื่อดูขนาดใหญ่ เลื่อนดูรูปถัดไปได้ด้วยปุ่มหรือลูกศรบนคีย์บอร์ด
 */
export function PostImageGrid({ images, title }: { images: string[]; title: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const count = images.length;

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenIndex(null);
      if (e.key === 'ArrowRight') setOpenIndex((i) => (i === null ? i : (i + 1) % count));
      if (e.key === 'ArrowLeft') setOpenIndex((i) => (i === null ? i : (i - 1 + count) % count));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openIndex, count]);

  if (count === 0) return null;

  const tileClass = (i: number) => {
    // กว้างเต็มกรอบ + สูงตายตัว — เดิม aspect-[16/10] คู่กับ max-h ทำให้เบราว์เซอร์หดความกว้างลงเพื่อรักษาสัดส่วน
    if (count === 1) return 'w-full h-64 sm:h-[360px]';
    if (count === 2) return 'h-52 sm:h-60';
    if (count === 3) return i === 0 ? 'row-span-2 h-[248px] sm:h-[300px]' : 'h-[122px] sm:h-[148px]';
    return 'h-[122px] sm:h-[148px]';
  };

  return (
    <>
      <div className={`mt-3 grid gap-1 overflow-hidden rounded-2xl ${count === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-label={`ดูรูปที่ ${i + 1} จาก ${count}`}
            className={`relative overflow-hidden bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${tileClass(i)}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- ไฟล์จาก /api/uploads/posts (ย่อเป็น webp แล้ว) */}
            <img src={src} alt={`${title} รูปที่ ${i + 1}`} loading="lazy" className="h-full w-full object-cover transition-transform hover:scale-[1.02]" />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 animate-fade-in"
            onClick={() => setOpenIndex(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`รูปที่ ${openIndex + 1} จาก ${count}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- ไฟล์จาก /api/uploads/posts */}
            <img
              src={images[openIndex]}
              alt={`${title} รูปที่ ${openIndex + 1}`}
              className="max-h-[88vh] max-w-full rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={() => setOpenIndex(null)}
              aria-label="ปิด"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenIndex((openIndex - 1 + count) % count);
                  }}
                  aria-label="รูปก่อนหน้า"
                  className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenIndex((openIndex + 1) % count);
                  }}
                  aria-label="รูปถัดไป"
                  className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                  {openIndex + 1} / {count}
                </span>
              </>
            )}
          </div>
        </ModalPortal>
      )}
    </>
  );
}
