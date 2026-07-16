import { AppShell } from '@/components/layout/app-shell';
import { GalleryGrid } from '@/modules/gallery/components/gallery-grid';

export default function GalleryPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-blue-600">Gallery</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Archive and storytelling</h1>
        </div>
        <GalleryGrid />
      </div>
    </AppShell>
  );
}
