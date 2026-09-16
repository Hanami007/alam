'use client';

import { useState, useEffect } from 'react';
import { GalleryGrid } from '@/modules/gallery/components/gallery-grid';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api-client';

export default function GalleryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number>(2);
  const [currentUserRole, setCurrentUserRole] = useState<string | undefined>(undefined);
  const [currentUserGeneration, setCurrentUserGeneration] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGallery() {
      try {
        setLoading(true);
        const [galleryRes, usersRes, meRes] = await Promise.allSettled([
          api.gallery.getItems(),
          api.alumni.getList(),
          api.auth.me(),
        ]);

        if (galleryRes.status === 'fulfilled' && Array.isArray(galleryRes.value)) {
          setItems(galleryRes.value);
        }
        if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
          setAllUsers(usersRes.value);
        }
        if (meRes.status === 'fulfilled' && meRes.value?.user?.id) {
          setCurrentUserId(meRes.value.user.id);
          setCurrentUserRole(meRes.value.user.role);
          setCurrentUserGeneration(meRes.value.user.generation);
        }
      } catch (err) {
        console.error('[GalleryPage] Error loading gallery:', err);
      } finally {
        setLoading(false);
      }
    }

    loadGallery();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-blue-600">Photo archive (apistudio + community tags)</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Archive and storytelling</h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-72 rounded-3xl bg-slate-200/70" />
            ))}
          </div>
        ) : (
          <GalleryGrid
            items={items}
            currentUserId={currentUserId}
            allUsers={allUsers}
            currentUserRole={currentUserRole}
            currentUserGeneration={currentUserGeneration}
          />
        )}
      </div>
    </AppShell>
  );
}