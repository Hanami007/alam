'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileCard } from '@/modules/profile/components/profile-card';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api-client';
import { USER_POINTS_UPDATED_EVENT } from '@/lib/events';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [taggedPhotos, setTaggedPhotos] = useState<any[]>([]);
  const [unlockedPhotos, setUnlockedPhotos] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [profileRes, activityRes, photosRes] = await Promise.allSettled([
        api.user.getProfile(),
        api.user.getActivity(),
        fetch('/api/user/photos').then((r) => r.json()),
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value && !profileRes.value.error) {
        const u = profileRes.value;
        setUser({
          id: u.id,
          name: u.name,
          student_id: u.studentId || u.student_id || '',
          email: u.email || '',
          generation: u.generation || '',
          province: u.province || '',
          work_province: u.workProvince || u.work_province || '',
          career_type: u.careerType || u.career_type || '',
          company: u.company || '',
          position: u.position || '',
          bio: u.bio || '',
          total_points: u.totalPoints ?? u.total_points ?? 0,
          avatar_url: u.avatarUrl || u.avatar_url || '',
          is_available_for_mentorship: Boolean(u.isAvailableForMentorship ?? u.is_available_for_mentorship),
          show_hometown_on_map: Boolean(u.showHometownOnMap ?? u.show_hometown_on_map),
          show_workplace_on_map: Boolean(u.showWorkplaceOnMap ?? u.show_workplace_on_map),
        });
      } else {
        router.replace('/login?callbackUrl=/profile');
      }

        if (activityRes.status === 'fulfilled' && Array.isArray(activityRes.value)) {
          setActivityLog(activityRes.value);
        } else {
          setActivityLog([]);
        }

        if (photosRes.status === 'fulfilled' && photosRes.value) {
          const { taggedPhotos: tagged = [], unlockedPhotos: unlocked = [] } = photosRes.value;
          setTaggedPhotos(tagged.map((p: any) => ({
            id: p.id,
            image_url: p.image_url,
            watermark_url: p.watermark_url || null,
            caption: p.caption || 'รูปภาพกิจกรรม',
            created_at: p.created_at,
            tagged_by_name: p.tagged_by_name || null,
          })));
          setUnlockedPhotos(unlocked.map((p: any) => ({
            id: p.id,
            image_url: p.image_url,
            watermark_url: p.watermark_url || null,
            caption: p.caption || 'รูปภาพที่ปลดล็อก',
            created_at: p.created_at,
          })));
        }
      } catch (err) {
        console.error('[ProfilePage] Error loading profile:', err);
      } finally {
        if (!isSilent) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadProfile();

    function handlePointsUpdated(e: Event) {
      const customEvent = e as CustomEvent<{ pointsAdded?: number }>;
      const added = customEvent.detail?.pointsAdded ?? 1;

      setUser((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          total_points: (prev.total_points ?? 0) + added,
        };
      });

      // Refetch full profile and activity log quietly in background
      loadProfile(true);
    }

    window.addEventListener(USER_POINTS_UPDATED_EVENT, handlePointsUpdated);
    return () => window.removeEventListener(USER_POINTS_UPDATED_EVENT, handlePointsUpdated);
  }, [loadProfile]);

  return (
    <AppShell>
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-64 rounded-3xl bg-slate-200/70" />
          <div className="h-48 rounded-3xl bg-slate-200/70" />
        </div>
      ) : (
        <ProfileCard
          user={user}
          taggedPhotos={taggedPhotos}
          unlockedPhotos={unlockedPhotos}
          activityLog={activityLog}
        />
      )}
    </AppShell>
  );
}