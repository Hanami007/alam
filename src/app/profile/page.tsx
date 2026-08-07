// วางไฟล์นี้ที่ src/app/profile/page.tsx
import { getUserProfile, getTaggedPhotos, getUnlockedPhotos } from '@/lib/db';
import { ProfileCard } from '@/modules/profile/components/profile-card';
import { AppShell } from '@/components/layout/app-shell';

// TODO: ยังไม่มีระบบ session จริง ใช้ student_id ตัวอย่างจาก seed data ไปก่อน
const CURRENT_USER_STUDENT_ID = '60010001';

export default async function ProfilePage() {
  const user = await getUserProfile(CURRENT_USER_STUDENT_ID);

  if (!user) {
    return (
      <AppShell>
        <p className="text-sm text-slate-400">ไม่พบข้อมูลผู้ใช้</p>
      </AppShell>
    );
  }

  const [taggedPhotos, unlockedPhotos] = await Promise.all([
    getTaggedPhotos(user.id),
    getUnlockedPhotos(user.id),
  ]);

  return (
    <AppShell>
      <ProfileCard user={user} taggedPhotos={taggedPhotos} unlockedPhotos={unlockedPhotos} />
    </AppShell>
  );
}