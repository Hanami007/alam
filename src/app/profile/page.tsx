import { getUserProfileById, getTaggedPhotos, getUnlockedPhotos, getActivityLog } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { ProfileCard } from '@/modules/profile/components/profile-card';
import { AppShell } from '@/components/layout/app-shell';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login?callbackUrl=/profile');
  }

  const user = await getUserProfileById(currentUser.id);

  if (!user) {
    return (
      <AppShell>
        <p className="text-sm text-slate-400">ไม่พบข้อมูลผู้ใช้</p>
      </AppShell>
    );
  }

  const [taggedPhotos, unlockedPhotos, activityLog] = await Promise.all([
    getTaggedPhotos(user.id),
    getUnlockedPhotos(user.id),
    getActivityLog(user.id),
  ]);

  return (
    <AppShell>
      <ProfileCard user={user} taggedPhotos={taggedPhotos} unlockedPhotos={unlockedPhotos} activityLog={activityLog} />
    </AppShell>
  );
}