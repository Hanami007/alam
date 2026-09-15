'use client';

import { useState, useEffect } from 'react';
import { SettingsPanel } from '@/modules/settings/components/settings-panel';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api-client';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const meRes = await api.auth.me().catch(() => null);
        if (meRes?.user) {
          setUser(meRes.user);
        } else {
          setUser({
            id: 2,
            name: 'สมชาย ใจดี',
            show_hometown_on_map: false,
            show_workplace_on_map: false,
          });
        }
      } catch (err) {
        console.error('[SettingsPage] Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  return (
    <AppShell>
      {loading ? (
        <div className="mx-auto max-w-4xl space-y-6 animate-pulse">
          <div className="h-20 rounded-3xl bg-slate-200/70" />
          <div className="h-96 rounded-3xl bg-slate-200/70" />
        </div>
      ) : (
        <SettingsPanel
          userId={user?.id || 2}
          userName={user?.name ?? 'ผู้ใช้งาน'}
          initialPrivacy={{
            showHometownOnMap: user?.show_hometown_on_map ?? false,
            showWorkplaceOnMap: user?.show_workplace_on_map ?? false,
          }}
        />
      )}
    </AppShell>
  );
}
