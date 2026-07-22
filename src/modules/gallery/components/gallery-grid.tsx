import { Lock, Search, Sparkles, Tag, UploadCloud } from 'lucide-react';
import { getGalleryItems } from '@/lib/db';

export async function GalleryGrid() {
  const items = await getGalleryItems();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white bg-white p-4 shadow-sm">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-[#F5FAFF] px-3.5 py-2.5 text-sm text-slate-400">
          <Search className="h-4 w-4" />
          <input placeholder="ค้นหาคลังภาพเก่า" className="w-56 border-none bg-transparent outline-none" />
        </label>
        <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0099FF] to-[#1E90FF] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0099FF]/25">
          <UploadCloud className="h-4 w-4" /> อัปโหลดรูป (Admin)
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="overflow-hidden rounded-[28px] border border-white bg-white shadow-sm transition hover:shadow-xl"
          >
            <div className="relative">
              <img
                src={item.locked ? item.image : item.original_image}
                alt={item.title}
                className={`h-48 w-full object-cover ${item.locked ? 'blur-sm' : ''}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              {item.locked ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/25">
                  <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-lg">
                    <Lock className="h-3.5 w-3.5" /> ตอบคำถามเพื่อดูรูปต้นฉบับ
                  </span>
                </div>
              ) : (
                <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#0099FF]">
                  <Sparkles className="h-3 w-3" /> ปลดล็อกแล้ว
                </span>
              )}
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                <span className="rounded-full bg-[#EAF6FF] px-2.5 py-1 text-xs font-semibold text-[#0099FF]">
                  +{item.points_for_unlock} คะแนน
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-400">{item.generation}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {item.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-[#EAF6FF] px-3 py-1 text-xs font-semibold text-[#0099FF]"
                  >
                    <Tag className="h-3 w-3" /> {tag}
                  </span>
                ))}
              </div>

              {item.locked ? (
                <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#F5FAFF] to-[#EAF6FF] p-4">
                  <p className="text-xs font-semibold text-slate-500">{item.unlock_question}</p>
                  <input
                    placeholder="พิมพ์คำตอบ..."
                    className="mt-2 w-full rounded-xl border border-white bg-white px-3 py-2 text-sm outline-none focus:border-[#0099FF]"
                  />
                  <button className="mt-2 rounded-xl bg-gradient-to-r from-[#0099FF] to-[#1E90FF] px-3.5 py-2 text-xs font-semibold text-white shadow-sm">
                    ยืนยันคำตอบ
                  </button>
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}