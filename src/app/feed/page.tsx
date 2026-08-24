'use client';

import { useState, useEffect } from 'react';
import { FeedList } from '@/modules/feed/components/feed-list';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api-client';
import { Sparkles } from 'lucide-react';

export default function FeedPage() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [latestPhotos, setLatestPhotos] = useState<any[]>([]);
  const [featuredAlumni, setFeaturedAlumni] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Fetch data via Browser HTTP Client from Backend API Gateway
        const [meRes, feedRes, photosRes, alumniRes, overviewRes] = await Promise.allSettled([
          api.auth.me(),
          api.feed.getPosts(),
          api.gallery.getItems(),
          api.alumni.getList(),
          api.admin.getOverview(),
        ]);

        if (meRes.status === 'fulfilled' && meRes.value?.user) {
          setCurrentUser(meRes.value.user);
        } else {
          // Default fallback user for client simulation if not logged in
          setCurrentUser({ id: 2, name: 'สมชาย ใจดี', role: 'alumni' });
        }

        if (feedRes.status === 'fulfilled' && Array.isArray(feedRes.value)) {
          setPosts(feedRes.value);
        }

        if (photosRes.status === 'fulfilled' && Array.isArray(photosRes.value)) {
          setLatestPhotos(photosRes.value.slice(0, 2));
        }

        if (alumniRes.status === 'fulfilled' && Array.isArray(alumniRes.value)) {
          setFeaturedAlumni(alumniRes.value.slice(0, 3));
        }

        if (overviewRes.status === 'fulfilled') {
          setStats(overviewRes.value);
        }
      } catch (err) {
        console.error('[FeedPage] Error loading feed data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <AppShell>
      {loading ? (
        <div className="space-y-6 animate-pulse">
          {/* Skeleton Banner */}
          <div className="h-36 rounded-3xl bg-slate-200/70 border border-slate-200" />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-28 rounded-3xl bg-slate-200/70" />
              <div className="h-64 rounded-3xl bg-slate-200/70" />
              <div className="h-48 rounded-3xl bg-slate-200/70" />
            </div>
            <div className="space-y-4 hidden lg:block">
              <div className="h-48 rounded-3xl bg-slate-200/70" />
              <div className="h-60 rounded-3xl bg-slate-200/70" />
            </div>
          </div>
        </div>
      ) : (
        <FeedList
          posts={posts}
          stats={stats}
          latestPhotos={latestPhotos}
          featuredAlumni={featuredAlumni}
          currentUserId={currentUser?.id || 2}
          currentUserRole={currentUser?.role || 'alumni'}
          currentUserName={currentUser?.name || 'สมชาย ใจดี'}
        />
      )}
    </AppShell>
  );
}