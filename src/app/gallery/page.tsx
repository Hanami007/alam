import { getGalleryItems, getAllApprovedUsers } from '@/lib/db';
import { GalleryGrid } from '@/modules/gallery/components/gallery-grid';
import { AppShell } from '@/components/layout/app-shell';

const CURRENT_USER_ID = 2; // TODO: ดึงจาก session จริง

export default async function GalleryPage() {
  const [items, allUsers] = await Promise.all([
    getGalleryItems(),
    getAllApprovedUsers(),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-blue-600">Photo archive</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Archive and storytelling</h1>
        </div>
        <GalleryGrid items={items} currentUserId={CURRENT_USER_ID} allUsers={allUsers} />
      </div>
    </AppShell>
  );
}