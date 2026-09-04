'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProfileCard } from '@/modules/profile/components/profile-card';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api-client';
import { USER_POINTS_UPDATED_EVENT } from '@/lib/events';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [taggedPhotos, setTaggedPhotos] = useState<any[]>([]);
  const [unlockedPhotos, setUnlockedPhotos] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [profileRes, activityRes, galleryRes] = await Promise.allSettled([
        api.user.getProfile(),
        api.user.getActivity(),
        api.gallery.getItems(),
      ]);

        if (profileRes.status === 'fulfilled' && profileRes.value && !profileRes.value.error) {
          const u = profileRes.value;
          setUser({
            id: u.id || 2,
            name: u.name || 'สมชาย ใจดี',
            student_id: u.studentId || u.student_id || '60010001',
            email: u.email || 'somchai.j@example.edu',
            generation: u.generation || 'รุ่น 43',
            province: u.province || 'กรุงเทพมหานคร',
            career_type: u.careerType || u.career_type || 'เอกชน',
            company: u.company ?? 'บริษัท เอบีซี จำกัด',
            position: u.position ?? 'Senior Developer',
            bio: u.bio ?? 'ดูแลระบบและพัฒนาโปรดักต์ให้ทีมงานภายใน',
            total_points: u.totalPoints ?? u.total_points ?? 16,
            avatar_url: u.avatarUrl || u.avatar_url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=600&q=80',
            is_available_for_mentorship: Boolean(u.isAvailableForMentorship ?? u.is_available_for_mentorship),
            show_hometown_on_map: Boolean(u.showHometownOnMap ?? u.show_hometown_on_map),
            show_workplace_on_map: Boolean(u.showWorkplaceOnMap ?? u.show_workplace_on_map),
          });
        } else {
          // Fallback mock profile for preview
          setUser({
            id: 2,
            name: 'สมชาย ใจดี',
            student_id: '60010001',
            email: 'somchai.j@example.edu',
            generation: 'รุ่น 43',
            province: 'กรุงเทพมหานคร',
            career_type: 'เอกชน',
            company: 'บริษัท เอบีซี จำกัด',
            position: 'Senior Developer',
            bio: 'ดูแลระบบและพัฒนาโปรดักต์ให้ทีมงานภายใน',
            total_points: 16,
            avatar_url: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=600&q=80',
            is_available_for_mentorship: false,
            show_hometown_on_map: false,
            show_workplace_on_map: false,
          });
        }

        if (activityRes.status === 'fulfilled' && Array.isArray(activityRes.value)) {
          setActivityLog(activityRes.value);
        } else {
          setActivityLog([
            { id: 1, description: 'ร่วมโหวตโพลสำรวจความคิดเห็น (+5 แต้ม)', points: 5, createdAt: '1 ก.พ. 2569' },
            { id: 2, description: 'ร่วมโหวต Hall of Fame (+10 แต้ม)', points: 10, createdAt: '5 ก.พ. 2569' },
            { id: 3, description: 'แสดงความคิดเห็นในโพสต์ (+1 แต้ม)', points: 1, createdAt: '16 ม.ค. 2569' },
          ]);
        }

        if (galleryRes.status === 'fulfilled' && Array.isArray(galleryRes.value)) {
          const photos = galleryRes.value;
          setTaggedPhotos(photos.slice(0, 2).map((p: any) => ({
            id: p.id,
            image_url: p.originalImage || p.image,
            title: p.title,
            generation: p.generation,
          })));
          setUnlockedPhotos(photos.filter((p: any) => !p.locked).map((p: any) => ({
            id: p.id,
            image_url: p.originalImage || p.image,
            title: p.title,
            generation: p.generation,
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