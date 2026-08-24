import { getFeedPosts, getAdminOverviewStats, getGalleryItems, getAlumniProfiles } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { FeedList } from '@/modules/feed/components/feed-list';
import { AppShell } from '@/components/layout/app-shell';
import { redirect } from 'next/navigation';

export default async function FeedPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login?callbackUrl=/feed');
  }

  const [posts, stats, galleryItems, alumniProfiles] = await Promise.all([
    getFeedPosts(),
    getAdminOverviewStats(),
    getGalleryItems(),
    getAlumniProfiles(),
  ]);

  return (
    <AppShell>
      <FeedList
        posts={posts}
        stats={stats}
        latestPhotos={galleryItems.slice(0, 2)}
        featuredAlumni={alumniProfiles.slice(0, 3)}
        currentUserId={currentUser.id}
        currentUserRole={currentUser.role}
        currentUserName={currentUser.name}
      />
    </AppShell>
  );
}