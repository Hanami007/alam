import { getUserById } from '@/lib/db';
import { SettingsPanel } from '@/modules/settings/components/settings-panel';
import { AppShell } from '@/components/layout/app-shell';

// TODO: ดึงจาก session จริง — ใช้ id=2 (alumni user จาก seed data) ไปก่อน
const CURRENT_USER_ID = 2;

export default async function SettingsPage() {
  const user = await getUserById(CURRENT_USER_ID);

  if (!user) {
    return (
      <AppShell>
        <div className="rounded-[28px] border border-rose-100 bg-rose-50 p-8 text-center">
          <p className="text-sm font-medium text-rose-600">ไม่พบข้อมูลผู้ใช้</p>
        </div>
      </AppShell>
    );
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
