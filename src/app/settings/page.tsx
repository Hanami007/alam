import { getCurrentUser } from '@/lib/auth';
import { SettingsPanel } from '@/modules/settings/components/settings-panel';
import { AppShell } from '@/components/layout/app-shell';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?callbackUrl=/settings');
  }

  return (
    <AppShell>
      <SettingsPanel
        userId={user.id}
        userName={user.name ?? 'ผู้ใช้งาน'}
        initialPrivacy={{
          showHometownOnMap: user.show_hometown_on_map ?? false,
          showWorkplaceOnMap: user.show_workplace_on_map ?? false,
        }}
      />
    </AppShell>
  );
}
