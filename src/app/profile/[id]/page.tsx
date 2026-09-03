'use client';

import { useState, useEffect, use } from 'react';
import { useParams } from 'next/navigation';
import { ProfileCard } from '@/modules/profile/components/profile-card';
import { AppShell } from '@/components/layout/app-shell';

export default function DynamicMemberProfilePage() {
  const params = useParams();
  const requestedId = params?.id as string;

  const [user, setUser] = useState<any>(null);
  const [taggedPhotos, setTaggedPhotos] = useState<any[]>([]);
  const [unlockedPhotos, setUnlockedPhotos] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!requestedId) return;
      try {
        setLoading(true);
        const profileUrl = `/api/user/profile?id=${requestedId}`;
        const activityUrl = `/api/user/activity?id=${requestedId}`;
        const photosUrl = `/api/user/photos?userId=${requestedId}`;

        const [profileRes, activityRes, photosRes] = await Promise.allSettled([
          fetch(profileUrl).then((r) => r.json()),
          fetch(activityUrl).then((r) => r.json()),
          fetch(photosUrl).then((r) => r.json()),
        ]);

        if (profileRes.status === 'fulfilled' && profileRes.value && !profileRes.value.error) {
          const u = profileRes.value;
          setIsOwner(Boolean(u.isOwner));
          setUser({
            id: u.id,
            name: u.name,
            student_id: u.studentId || u.student_id,
            email: u.email,
            generation: u.generation,
            province: u.province,
            career_type: u.careerType || u.career_type,
            company: u.company,
            position: u.position,
            bio: u.bio,
            student_status: u.studentStatus || u.student_status || 'alumni',
            total_points: u.totalPoints ?? u.total_points ?? 0,
            avatar_url: u.avatarUrl || u.avatar_url || '',
          });
        } else {
          setUser(null);
        }

        if (activityRes.status === 'fulfilled') {
          const actData = activityRes.value;
          if (Array.isArray(actData)) {
            setActivityLog(actData);
          } else {
            setActivityLog([]);
          }
        } else {
          setActivityLog([]);
        }

        if (photosRes.status === 'fulfilled' && photosRes.value) {
          setTaggedPhotos(photosRes.value.taggedPhotos || []);
          setUnlockedPhotos(photosRes.value.unlockedPhotos || []);
        } else {
          setTaggedPhotos([]);
          setUnlockedPhotos([]);
        }
      } catch (err) {
        console.error('[DynamicProfilePage] Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [requestedId]);

  return (
    <AppShell>
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-64 rounded-3xl bg-slate-200/70" />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-6">
            <div className="h-56 rounded-3xl bg-slate-200/70" />
            <div className="h-56 rounded-3xl bg-slate-200/70" />
          </div>
        </div>
      ) : (
        <ProfileCard
          user={user}
          taggedPhotos={taggedPhotos}
          unlockedPhotos={unlockedPhotos}
          activityLog={activityLog}
          isOwner={isOwner}
        />
      )}
    </AppShell>
  );
}
