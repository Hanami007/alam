import { getFeedPosts, getAdminOverviewStats, getGalleryItems, getAlumniProfiles } from '@/lib/db';
import { FeedList } from '@/modules/feed/components/feed-list';
import { AppShell } from '@/components/layout/app-shell';

const CURRENT_USER_ID = 2; // TODO: ดึงจาก session จริง

export default async function FeedPage() {
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
        currentUserId={CURRENT_USER_ID}
      />
    </AppShell>
  );
}