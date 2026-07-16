import { AppShell } from '@/components/layout/app-shell';
import { ProfileCard } from '@/modules/profile/components/profile-card';

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-blue-600">My Profile</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Own your profile</h1>
        </div>
        <ProfileCard />
      </div>
    </AppShell>
  );
}
