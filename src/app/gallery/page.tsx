import { getGalleryItems, getAllApprovedUsers } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { GalleryGrid } from '@/modules/gallery/components/gallery-grid';
import { AppShell } from '@/components/layout/app-shell';
import { redirect } from 'next/navigation';

export default async function GalleryPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login?callbackUrl=/gallery');
  }

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
        <GalleryGrid items={items} currentUserId={currentUser.id} allUsers={allUsers} />
      </div>
    </AppShell>
  );
}