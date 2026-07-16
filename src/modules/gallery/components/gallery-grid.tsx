import { galleryItems } from '@/lib/data';
import { Search, Download, UploadCloud } from 'lucide-react';

export function GalleryGrid() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
          <Search className="h-4 w-4" />
          <input placeholder="Search gallery" className="w-56 border-none bg-transparent outline-none" />
        </label>
        <button className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
          <UploadCloud className="h-4 w-4" /> Upload photo
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {galleryItems.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <img src={item.image} alt={item.title} className="h-48 w-full object-cover" />
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <button className="rounded-2xl bg-slate-50 p-2 text-slate-600"><Download className="h-4 w-4" /></button>
              </div>
              <p className="mt-2 text-sm text-slate-500">{item.generation} · {item.year}</p>
              <p className="mt-3 text-sm text-slate-600">Album: {item.album}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">{tag}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
