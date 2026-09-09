'use client';

import { useState, useEffect } from 'react';
import { GlobePanel } from '@/modules/map/components/globe-panel';
import { MapPanel } from '@/modules/map/components/map-panel';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api-client';
import { Globe, Map as MapIcon } from 'lucide-react';

export default function MapPage() {
  const [data, setData] = useState<{ hometownData: any[]; workplaceData: any[] }>({
    hometownData: [],
    workplaceData: [],
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'globe' | 'thailand'>('globe');
  const [selectedProvinceForThailand, setSelectedProvinceForThailand] = useState<string | null>(null);

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
        <div className="space-y-4">
          {/* Top View Mode Switcher Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80 shadow-xs">
              <button
                onClick={() => setViewMode('globe')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer ${
                  viewMode === 'globe'
                    ? 'bg-white text-indigo-700 shadow-md shadow-indigo-100 scale-[1.02]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>แผนที่โลก 3D (CSMJU Global)</span>
              </button>

              <button
                onClick={() => setViewMode('thailand')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer ${
                  viewMode === 'thailand'
                    ? 'bg-white text-teal-700 shadow-md shadow-teal-100 scale-[1.02]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <MapIcon className="w-4 h-4 text-teal-600" />
                <span>แผนที่ประเทศไทย (รายจังหวัด 77 จังหวัด)</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>อัปเดตข้อมูลตำแหน่งศิษย์เก่าล่าสุด</span>
            </div>
          </div>

          {/* Active View Component */}
          {viewMode === 'globe' ? (
            <GlobePanel
              hometownData={data.hometownData}
              workplaceData={data.workplaceData}
              onSwitchToThailand={(prov) => {
                if (prov) setSelectedProvinceForThailand(prov);
                setViewMode('thailand');
              }}
            />
          ) : (
            <MapPanel
              hometownData={data.hometownData}
              workplaceData={data.workplaceData}
              initialSelectedProvince={selectedProvinceForThailand}
              onSwitchToGlobe={() => setViewMode('globe')}
            />
          )}
        </div>
      )}
    </AppShell>
  );
}