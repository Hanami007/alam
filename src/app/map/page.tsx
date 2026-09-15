'use client';

import { useState, useEffect } from 'react';
import { GlobePanel } from '@/modules/map/components/globe-panel';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api-client';

export default function MapPage() {
  const [data, setData] = useState<{ hometownData: any[]; workplaceData: any[] }>({
    hometownData: [],
    workplaceData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMap() {
      try {
        setLoading(true);
        const res = await api.map.getData();
        if (res && res.hometownData && res.workplaceData) {
          setData(res);
        }
      } catch (err) {
        console.error('[MapPage] Error loading map data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadMap();
  }, []);

  return (
    <AppShell>
      {loading ? (
        /* Loading Skeleton */
        <div className="space-y-6 animate-pulse">
          <div className="h-36 rounded-[32px] bg-slate-200/70" />
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-32 rounded-full bg-slate-200/70" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="h-[620px] rounded-[32px] bg-slate-200/70" />
            <div className="h-[620px] rounded-[32px] bg-slate-200/70" />
          </div>
        </div>
      ) : (
        <GlobePanel hometownData={data.hometownData} workplaceData={data.workplaceData} />
      )}
    </AppShell>
  );
}
