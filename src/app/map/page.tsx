'use client';

import { useState, useEffect } from 'react';
import { MapPanel } from '@/modules/map/components/map-panel';
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
        <div className="space-y-6 animate-pulse">
          <div className="h-28 rounded-3xl bg-slate-200/70" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-[600px] rounded-3xl bg-slate-200/70" />
            <div className="h-[600px] rounded-3xl bg-slate-200/70 hidden lg:block" />
          </div>
        </div>
      ) : (
        <MapPanel hometownData={data.hometownData} workplaceData={data.workplaceData} />
      )}
    </AppShell>
  );
}