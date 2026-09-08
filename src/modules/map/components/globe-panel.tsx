'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import {
  Globe,
  Users,
  MapPin,
  RotateCcw,
  Sparkles,
  X,
  ChevronRight,
  GraduationCap,
  Building2,
  Briefcase,
  TrendingUp,
  Home,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  GLOBE_CLUSTERS,
  GLOBE_REGION_NAVS,
  MAEJO_ORIGIN,
  TOTAL_ALUMNI_COUNT,
  type GlobeCountryCluster,
  type GlobeAlumni,
} from '@/lib/globe-data';

// ─── Dynamic import (ssr: false) สำหรับ react-globe.gl ───────────────────────
const ReactGlobe = dynamic(() => import('react-globe.gl').then((m) => m.default ?? m), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-400/30 animate-ping" />
        <div className="absolute inset-2 rounded-full border-4 border-indigo-600/50 animate-spin" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-4 rounded-full bg-indigo-50 backdrop-blur-sm" />
      </div>
      <p className="text-slate-600 text-sm font-semibold tracking-wider animate-pulse">กำลังโหลดแผนที่โลก 3D...</p>
    </div>
  ),
});

type MapMode = 'hometown' | 'workplace';
type RegionKey = 'all' | 'thailand' | 'asia' | 'americas' | 'europe' | 'oceania' | 'middleeast';

interface GlobePanelProps {
  hometownData?: any[];
  workplaceData?: any[];
}

// ─── Regional Colors (Clean, Modern Light-theme Friendly) ─────────────────────
const REGION_COLORS: Record<GlobeCountryCluster['region'], { ring: string; glow: string; bg: string; label: string }> = {
  thailand:   { ring: '#4F46E5', glow: 'rgba(79,70,229,0.25)',  bg: '#EEF2FF', label: 'ไทย' },
  asia:       { ring: '#0D9488', glow: 'rgba(13,148,136,0.25)', bg: '#F0FDFA', label: 'เอเชีย' },
  americas:   { ring: '#D97706', glow: 'rgba(217,119,6,0.25)',  bg: '#FFFBEB', label: 'อเมริกา' },
  europe:     { ring: '#9333EA', glow: 'rgba(147,51,234,0.25)', bg: '#FAF5FF', label: 'ยุโรป' },
  oceania:    { ring: '#16A34A', glow: 'rgba(22,163,74,0.25)',  bg: '#F0FDF4', label: 'โอเชียเนีย' },
  middleeast: { ring: '#DC2626', glow: 'rgba(220,38,38,0.25)',  bg: '#FEF2F2', label: 'ตะวันออกกลาง' },
};

// ─── Natural Earth Country Name / ISO Mapping ────────────────────────────────
const COUNTRY_GEO_MAP: Record<string, string[]> = {
  TH: ['TH', 'THA', 'Thailand'],
  JP: ['JP', 'JPN', 'Japan'],
  SG: ['SG', 'SGP', 'Singapore'],
  US: ['US', 'USA', 'United States of America', 'United States'],
  AU: ['AU', 'AUS', 'Australia'],
  DE: ['DE', 'DEU', 'Germany'],
  GB: ['GB', 'GBR', 'United Kingdom'],
  CA: ['CA', 'CAN', 'Canada'],
  KR: ['KR', 'KOR', 'South Korea', 'Korea, Republic of'],
  NL: ['NL', 'NLD', 'Netherlands'],
  FR: ['FR', 'FRA', 'France'],
  CH: ['CH', 'CHE', 'Switzerland'],
  AE: ['AE', 'ARE', 'United Arab Emirates'],
  CN: ['CN', 'CHN', 'China'],
  TW: ['TW', 'TWN', 'Taiwan'],
};

function getClusterForFeature(feature: any): GlobeCountryCluster | undefined {
  const p = feature.properties || {};
  const iso2 = p.ISO_A2;
  const iso3 = p.ISO_A3 || p.ADM0_A3;
  const name = p.NAME || p.NAME_LONG;

  for (const [code, aliases] of Object.entries(COUNTRY_GEO_MAP)) {
    if (
      (iso2 && iso2 !== '-99' && aliases.includes(iso2)) ||
      (iso3 && aliases.includes(iso3)) ||
      (name && aliases.includes(name))
    ) {
      return GLOBE_CLUSTERS.find((c) => c.country_code === code);
    }
  }
  return undefined;
}

// ─── Map Pin & Data Helpers ──────────────────────────────────────────────────


// การ์ดศิษย์เก่าในธีมสว่าง
function AlumniCard({ alumni }: { alumni: GlobeAlumni }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-200 transition-colors group">
      <div className="relative shrink-0">
        {alumni.avatar_url ? (
          <img src={alumni.avatar_url} alt={alumni.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-200" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {alumni.name.charAt(0)}
          </div>
        )}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-xs">
          <GraduationCap className="w-2 h-2 text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-900 font-bold text-sm truncate">{alumni.name}</p>
        <p className="text-slate-600 text-xs truncate">{alumni.position}</p>
        {alumni.company && (
          <div className="flex items-center gap-1 mt-0.5">
            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
            <p className="text-slate-500 text-xs truncate">{alumni.company}</p>
          </div>
        )}
        {alumni.generation && (
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
            {alumni.generation}
          </span>
        )}
      </div>
    </div>
  );
}

export function GlobePanel({ hometownData = [], workplaceData = [] }: GlobePanelProps) {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 720, height: 620 });
  const [mode, setMode] = useState<MapMode>('hometown');
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>('all');
  const [selectedCluster, setSelectedCluster] = useState<GlobeCountryCluster | null>(null);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [globeReady, setGlobeReady] = useState(false);
  const [countries, setCountries] = useState<any[]>([]);

  // Fetch world countries GeoJSON
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then((r) => r.json())
      .then((data) => setCountries(data.features ?? []))
      .catch(() => setCountries([]));
  }, []);

  // Responsive container measurement (ให้ลูกโลกขยายเต็มกรอบ 100% เสมอ)
  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setDimensions({
          width: w,
          height: Math.max(560, Math.min(Math.round(w * 0.85), 680)),
        });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // สเปกพื้นผิวลูกโลกธีมสว่าง (Clean Soft Sky-Blue Ocean)
  const globeMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#dbeafe', // สีมหาสมุทรฟ้านวลสะอาดตา
      roughness: 0.65,
      metalness: 0.05,
    });
  }, []);

  // Globe ready callback
  const handleGlobeReady = useCallback(() => {
    setGlobeReady(true);
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 4, lng: 100, altitude: 2.1 }, 0);
    }
  }, []);

  // ฟังก์ชันซูมเข้าไปยังประเทศ (Zoom-in to country ให้เต็มกรอบ)
  const handleZoomCountry = useCallback((cluster: GlobeCountryCluster) => {
    setSelectedCluster(cluster);
    setIsZoomedIn(true);
    setAutoRotate(false);
    if (globeRef.current) {
      // ซูมเข้าใกล้ที่ระดับ altitude 0.28 เพื่อให้ประเทศขยายเต็มกรอบสวยงาม
      globeRef.current.pointOfView(
        { lat: cluster.lat, lng: cluster.lng, altitude: 0.28 },
        1500
      );
    }
  }, []);

  // ฟังก์ชันซูมออกกลับภาพรวมโลก (Zoom-out to global view)
  const handleResetZoom = useCallback(() => {
    setSelectedCluster(null);
    setIsZoomedIn(false);
    setAutoRotate(true);
    if (globeRef.current) {
      globeRef.current.pointOfView(
        { lat: 4, lng: 100, altitude: 2.1 },
        1400
      );
    }
  }, []);

  // บิน (fly) ไปยัง region ที่เลือก
  const flyToRegion = useCallback((regionKey: RegionKey) => {
    const nav = GLOBE_REGION_NAVS.find((r) => r.key === regionKey);
    if (!nav || !globeRef.current) return;
    setAutoRotate(regionKey === 'all');
    setSelectedCluster(null);
    setIsZoomedIn(false);
    globeRef.current.pointOfView({ lat: nav.lat, lng: nav.lng, altitude: nav.altitude }, 1200);
  }, []);

  // รวมศิษย์เก่าของประเทศที่เลือก
  const selectedCountryAlumni = useMemo(() => {
    if (!selectedCluster) return [];
    return GLOBE_CLUSTERS.filter((c) => c.country_code === selectedCluster.country_code)
      .flatMap((c) => c.alumni);
  }, [selectedCluster]);

  const selectedCountryTotalCount = selectedCountryAlumni.length;

  // รายชื่อประเทศที่มีศิษย์เก่า (สำหรับแถบทางลัด Quick Jump)
  const uniqueCountriesWithAlumni = useMemo(() => {
    const map = new Map<string, GlobeCountryCluster>();
    for (const c of GLOBE_CLUSTERS) {
      if (!map.has(c.country_code)) {
        map.set(c.country_code, c);
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const countA = GLOBE_CLUSTERS.filter((x) => x.country_code === a.country_code).reduce((sum, x) => sum + x.count, 0);
      const countB = GLOBE_CLUSTERS.filter((x) => x.country_code === b.country_code).reduce((sum, x) => sum + x.count, 0);
      return countB - countA;
    });
  }, []);

  // วงแหวนสัญญาณเรขาคณิต (Origin แม่โจ้ + วงแหวนไฮไลท์ประเทศที่เลือก)
  const ringsData = useMemo(() => {
    const list = [
      {
        lat: MAEJO_ORIGIN.lat,
        lng: MAEJO_ORIGIN.lng,
        color: ['rgba(245,158,11,0.95)', 'rgba(245,158,11,0.3)', 'rgba(245,158,11,0)'],
        maxRadius: 4.5,
      },
    ];
    if (selectedCluster) {
      const col = REGION_COLORS[selectedCluster.region].ring;
      list.push({
        lat: selectedCluster.lat,
        lng: selectedCluster.lng,
        color: [col, `${col}55`, `${col}00`],
        maxRadius: 3.5,
      });
    }
    return list;
  }, [selectedCluster]);

  const totalCountryCount = uniqueCountriesWithAlumni.length;

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Header (ธีมสว่าง สบายตา ทันสมัย) ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-indigo-50/90 via-white to-sky-50/80 p-6 sm:p-8 border border-indigo-100 shadow-sm">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
                  <Globe className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  CSMJU Global Map
                </h1>
                <p className="text-indigo-600 text-xs sm:text-sm font-semibold">แผนที่โลกศิษย์เก่า • กดที่หมุดปักเพื่อซูมดูประเทศ</p>
              </div>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="flex gap-3 flex-wrap">
            {[
              { icon: Users,    value: TOTAL_ALUMNI_COUNT, label: 'ศิษย์เก่า', bg: 'bg-indigo-50 border-indigo-200/60 text-indigo-700' },
              { icon: MapPin,   value: totalCountryCount,   label: 'ประเทศ',    bg: 'bg-teal-50 border-teal-200/60 text-teal-700' },
              { icon: TrendingUp, value: GLOBE_CLUSTERS.length, label: 'เมือง/จุด', bg: 'bg-amber-50 border-amber-200/60 text-amber-700' },
            ].map(({ icon: Icon, value, label, bg }) => (
              <div key={label} className={`flex flex-col items-center px-4 py-2 rounded-2xl border ${bg}`}>
                <Icon className="h-4 w-4 mb-0.5 opacity-80" />
                <span className="font-black text-lg leading-none">{value}</span>
                <span className="text-slate-500 text-xs font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Maejo Origin callout */}
        <div className="relative z-10 mt-4 flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 w-fit">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
          </div>
          <span className="text-emerald-800 text-xs font-bold tracking-wide">
            🎓 จุดกำเนิด: มหาวิทยาลัยแม่โจ้ เชียงใหม่ • ปักหมุดเชื่อมโยงสู่ศิษย์เก่าทั่วโลก
          </span>
        </div>
      </div>

      {/* ─── Controls & Country Quick Switcher ──────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {/* Mode Toggle & Reset View */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
            {([
              { key: 'hometown',  icon: Home,     label: '🏡 ภูมิลำเนา' },
              { key: 'workplace', icon: Briefcase, label: '💼 ที่ทำงาน/เรียน' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
                  mode === key
                    ? 'bg-white text-indigo-700 shadow-md shadow-indigo-100'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Quick Zoom-out if currently zoomed */}
          {isZoomedIn && (
            <button
              onClick={handleResetZoom}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ซูมออกกลับมุมมองโลก (Reset)</span>
            </button>
          )}
        </div>

        {/* Quick Country Pills (กดแล้วซูมเข้าไปยังประเทศนั้นทันที) */}
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>กดหมุดประเทศที่มีคน ({totalCountryCount} ประเทศ):</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {uniqueCountriesWithAlumni.map((cluster) => {
              const countryTotal = GLOBE_CLUSTERS.filter((x) => x.country_code === cluster.country_code)
                .reduce((s, x) => s + x.count, 0);
              const isSelected = selectedCluster?.country_code === cluster.country_code;

              return (
                <button
                  key={cluster.country_code}
                  onClick={() => handleZoomCountry(cluster)}
                  className={`flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-all duration-200 cursor-pointer border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 scale-105'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <span className="text-base leading-none">{cluster.flag}</span>
                  <span>{cluster.country_name}</span>
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isSelected ? 'bg-white text-indigo-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {countryTotal}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Region Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {GLOBE_REGION_NAVS.map((nav) => {
            const isActive = selectedRegion === nav.key && !isZoomedIn;
            return (
              <button
                key={nav.key}
                onClick={() => {
                  setSelectedRegion(nav.key as RegionKey);
                  flyToRegion(nav.key as RegionKey);
                }}
                className={`flex items-center gap-2 shrink-0 rounded-full px-4 py-2 text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer active:scale-95 border ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 border-indigo-600 scale-105'
                    : 'bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span>{nav.flag}</span>
                <span className="hidden sm:inline">{nav.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => {
              setAutoRotate((v) => !v);
            }}
            className={`flex items-center gap-2 shrink-0 rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer border ${
              autoRotate
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <RotateCcw className={`h-3.5 w-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            <span className="hidden sm:inline">{autoRotate ? 'หยุดหมุน' : 'หมุนอัตโนมัติ'}</span>
          </button>
        </div>
      </div>

      {/* ─── Globe + Side Panel ──────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px] items-start">

        {/* Globe Canvas Container (ขยายเต็มกรอบ 100%) */}
        <div
          ref={containerRef}
          className="relative rounded-[32px] bg-[#dbeafe] border border-slate-200/90 overflow-hidden shadow-lg w-full"
          style={{ height: dimensions.height }}
        >

          {/* Active Zoom Spotlight Banner */}
          {selectedCluster && isZoomedIn && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/95 border border-indigo-200 shadow-xl backdrop-blur-md">
              <span className="text-3xl">{selectedCluster.flag}</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                  <p className="text-indigo-600 text-[11px] font-extrabold uppercase tracking-wide">กำลังซูมเจาะจงประเทศ</p>
                </div>
                <p className="text-slate-900 text-sm font-extrabold">{selectedCluster.country_name}</p>
              </div>
              <button
                onClick={handleResetZoom}
                className="ml-2 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-200 cursor-pointer active:scale-95"
              >
                <ZoomOut className="w-3.5 h-3.5" />
                ซูมออก
              </button>
            </div>
          )}

          {/* Globe Canvas Render */}
          <div className="w-full h-full flex items-center justify-center">
            <ReactGlobe
              ref={globeRef}
              onGlobeReady={handleGlobeReady}
              width={dimensions.width}
              height={dimensions.height}
              backgroundColor="#dbeafe"
              // ─── Light Theme Globe Sphere ─────────────────────────────────
              showGlobe={true}
              globeMaterial={globeMaterial}
              showGraticules={true} // เส้นละติจูด/ลองจิจูดเบาๆ ให้เห็นมิติโลก
              showAtmosphere={true}
              atmosphereColor="#93c5fd" // แสงชั้นบรรยากาศฟ้าใส
              atmosphereAltitude={0.12}

              // ─── Polygons (แผ่นดินและประเทศสีขาว/พาสเทลสะอาดตา) ───────────
              polygonsData={countries}
              polygonGeoJsonGeometry={(d: any) => d.geometry}
              polygonCapColor={(d: any) => {
                const c = getClusterForFeature(d);
                if (!c) return '#ffffff'; // ประเทศที่ไม่มีคนเป็นสีขาวเรียบ
                if (selectedCluster?.country_code === c.country_code) {
                  return '#c7d2fe'; // สีม่วงอ่อนเมื่อถูกเลือก
                }
                return '#e0e7ff'; // สีครามพาสเทลสำหรับประเทศที่มีคน
              }}
              polygonSideColor={(d: any) => {
                const c = getClusterForFeature(d);
                if (!c) return '#e2e8f0';
                return '#a5b4fc';
              }}
              polygonStrokeColor={(d: any) => {
                const c = getClusterForFeature(d);
                if (!c) return '#cbd5e1'; // เส้นขอบสีเทาอ่อนสะอาด
                if (selectedCluster?.country_code === c.country_code) {
                  return '#4338ca';
                }
                return '#6366f1'; // เส้นขอบเด่นชัดสำหรับประเทศที่มีคน
              }}
              polygonAltitude={(d: any) => {
                const c = getClusterForFeature(d);
                if (!c) return 0.006; // แบนราบ
                if (selectedCluster?.country_code === c.country_code) return 0.045; // ยกสูงเมื่อถูกซูม
                return 0.022; // ยกตัวขึ้นเล็กน้อยให้ดูมีมิติ
              }}
              polygonsTransitionDuration={300}
              onPolygonClick={(d: any) => {
                const c = getClusterForFeature(d);
                if (c) {
                  handleZoomCountry(c);
                }
              }}

              // ─── Surface Anchor Points (จุดเรืองแสงบนพื้นผิวโลก) ─────────────
              pointsData={GLOBE_CLUSTERS}
              pointLat="lat"
              pointLng="lng"
              pointAltitude={0.012}
              pointRadius={(d: any) => selectedCluster?.country_code === d.country_code ? 0.45 : 0.25}
              pointColor={(d: any) => selectedCluster?.country_code === d.country_code ? '#4338ca' : REGION_COLORS[d.region as GlobeCountryCluster['region']].ring}
              onPointClick={(d: any) => handleZoomCountry(d)}

              // ─── Origin & Active Pulsing Rings ────────────────────────────
              ringsData={ringsData}
              ringLat="lat"
              ringLng="lng"
              ringColor={(d: any) => d.color}
              ringMaxRadius={(d: any) => d.maxRadius}
              ringPropagationSpeed={2.5}
              ringRepeatPeriod={800}

              // ─── Sleek Modern Map Pins (หมุดปักแผนที่สวยงาม ขนาดพอดี ไม่บังจอ) ───
              htmlElementsData={GLOBE_CLUSTERS}
              htmlLat="lat"
              htmlLng="lng"
              htmlAltitude={0.025}
              htmlElement={(d: any) => {
                const el = document.createElement('div');
                const isSel = selectedCluster?.country_code === d.country_code;
                const color = REGION_COLORS[d.region as GlobeCountryCluster['region']].ring;
                el.style.cssText = `
                  cursor: pointer;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  user-select: none;
                  filter: drop-shadow(0 3px 6px rgba(15,23,42,0.18));
                  transform: ${isSel ? 'scale(1.15) translateY(-6px)' : 'scale(1) translateY(-2px)'};
                  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
                `;
                el.innerHTML = `
                  <div style="
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    background: ${isSel ? '#4338ca' : '#ffffff'};
                    color: ${isSel ? '#ffffff' : '#0f172a'};
                    border: 1.5px solid ${isSel ? '#4338ca' : color};
                    border-radius: 9999px;
                    padding: 2px 7px;
                    white-space: nowrap;
                    font-family: inherit;
                  ">
                    <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${isSel ? '#ffffff' : color};flex-shrink:0;"></span>
                    <span style="font-size: 11px; font-weight: 800; letter-spacing: -0.2px;">${d.city}</span>
                    <span style="
                      background:${isSel ? '#312e81' : color};
                      color:#ffffff;
                      font-size: 10px;
                      font-weight: 900;
                      padding:0.5px 5px;
                      border-radius:10px;
                      line-height:1.3;
                    ">${d.count}</span>
                  </div>
                  <div style="
                    width: 0;
                    height: 0;
                    border-left: 4.5px solid transparent;
                    border-right: 4.5px solid transparent;
                    border-top: 5px solid ${isSel ? '#4338ca' : color};
                    margin-top: -1px;
                  "></div>
                `;
                el.onclick = () => handleZoomCountry(d);
                el.onmouseenter = () => { el.style.transform = 'scale(1.22) translateY(-6px)'; };
                el.onmouseleave = () => { el.style.transform = isSel ? 'scale(1.15) translateY(-6px)' : 'scale(1) translateY(-2px)'; };
                return el;
              }}

              // ─── Interactive Controls ────────────────────────────────────
              enablePointerInteraction={true}
            />
          </div>

          {/* Auto-rotate indicator */}
          {autoRotate && (
            <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-slate-200 shadow-sm backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-600 text-xs font-semibold">กำลังหมุนโลก</span>
            </div>
          )}

          {/* Hint */}
          {globeReady && (
            <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white/90 border border-slate-200 shadow-sm backdrop-blur-sm">
              <span className="text-slate-600 text-xs font-semibold">📍 กดที่หมุดเพื่อซูมเข้า</span>
            </div>
          )}
        </div>

        {/* ─── Right: Country Detail / Cluster List ────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Zoomed Selected Country Detail Card */}
          {selectedCluster && (
            <div className="relative rounded-[28px] bg-white border border-indigo-200/80 shadow-xl overflow-hidden animate-fade-in">
              {/* Accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5 rounded-t-[28px]"
                style={{ background: REGION_COLORS[selectedCluster.region].ring }}
              />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl leading-none">{selectedCluster.flag}</span>
                    <div>
                      <h3 className="text-slate-900 font-extrabold text-xl leading-tight">{selectedCluster.country_name}</h3>
                      <p className="text-slate-500 text-xs font-medium">
                        {selectedCluster.city} • ภูมิภาค {REGION_COLORS[selectedCluster.region].label}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleResetZoom}
                    className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    title="ปิด / ซูมออก"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between mb-4 p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span className="text-slate-900 font-extrabold text-sm">
                      ศิษย์เก่าในประเทศนี้ {selectedCountryTotalCount} คน
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-600 text-white shadow-xs">
                    Zoomed
                  </span>
                </div>

                <div className="space-y-2.5 max-h-80 overflow-y-auto scrollbar-hide">
                  {selectedCountryAlumni.map((a) => (
                    <AlumniCard key={a.id} alumni={a} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Country Cluster List */}
          <div className="rounded-[28px] bg-white border border-slate-200/90 shadow-card overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-indigo-600" />
                  <h2 className="font-extrabold text-slate-800 text-base">รายชื่อประเทศที่มีศิษย์เก่า</h2>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-xs">
                  {totalCountryCount} ประเทศ
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto scrollbar-hide">
              {GLOBE_CLUSTERS.map((cluster) => {
                const colors = REGION_COLORS[cluster.region];
                const isSelected = selectedCluster?.country_code === cluster.country_code;
                return (
                  <button
                    key={`${cluster.country_code}-${cluster.city}`}
                    onClick={() => handleZoomCountry(cluster)}
                    className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all duration-150 cursor-pointer ${
                      isSelected ? 'bg-indigo-50/90 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-2xl shrink-0">{cluster.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{cluster.city}</p>
                      <p className="text-slate-500 text-xs truncate">{cluster.country_name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-xs font-extrabold px-2.5 py-1 rounded-full"
                        style={{ background: colors.bg, color: colors.ring, border: `1px solid ${colors.ring}30` }}
                      >
                        {cluster.count} คน
                      </span>
                      <ZoomIn className={`w-4 h-4 transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="rounded-[24px] bg-white border border-slate-200/80 p-4 shadow-xs">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">สีหมุดปักตามภูมิภาค</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(REGION_COLORS).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0 shadow-xs" style={{ background: val.ring }} />
                  <span className="text-slate-700 text-xs font-semibold">{val.label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
