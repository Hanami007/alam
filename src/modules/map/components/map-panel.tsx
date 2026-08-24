'use client';
import { useState, useMemo } from 'react';
import { THAILAND_PROVINCE_PATHS, THAILAND_MAP_VIEWBOX } from '@/lib/thailand-province-paths';
import {
  Home,
  Briefcase,
  MapPin,
  Users,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  TrendingUp,
  GraduationCap,
  Building2,
  ChevronRight,
  Info,
  X,
  Compass,
  CheckCircle2,
} from 'lucide-react';

type MapMode = 'hometown' | 'workplace';
type RegionKey = 'all' | 'metro' | 'north' | 'northeast' | 'central' | 'south' | 'east_west';

interface MapPoint {
  id: number;
  name: string;
  avatar_url?: string;
  position?: string;
  company?: string;
  generation?: string;
  career_type?: string;
  student_status?: string;
  province_id: number;
  province_name: string;
  region: string;
  metro: boolean;
}

interface MapPanelProps {
  hometownData: MapPoint[];
  workplaceData: MapPoint[];
}

const METRO_PROVINCES = ['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'สมุทรสาคร', 'นครปฐม'];

const REGION_CONFIG: Record<RegionKey, { label: string; icon: string; provinces?: string[]; viewBox?: { x: number; y: number; width: number; height: number } }> = {
  all: {
    label: 'ทั้งหมด (ทั่วประเทศ)',
    icon: '🗺️',
    viewBox: { x: 0, y: 0, width: THAILAND_MAP_VIEWBOX.width, height: THAILAND_MAP_VIEWBOX.height },
  },
  metro: {
    label: 'กรุงเทพฯ-ปริมณฑล',
    icon: '🏙️',
    provinces: METRO_PROVINCES,
    viewBox: { x: 140.2, y: 364.5, width: 84.4, height: 66.4 },
  },
  north: {
    label: 'ภาคเหนือ',
    icon: '🏔️',
    provinces: ['เชียงใหม่', 'เชียงราย', 'ลำปาง', 'ลำพูน', 'แม่ฮ่องสอน', 'น่าน', 'พะเยา', 'แพร่', 'อุตรดิตถ์', 'ตาก', 'สุโขทัย', 'พิษณุโลก', 'พิจิตร', 'กำแพงเพชร', 'เพชรบูรณ์', 'นครสวรรค์', 'อุทัยธานี'],
    viewBox: { x: 0, y: 0, width: 280, height: 360 },
  },
  northeast: {
    label: 'ภาคอีสาน',
    icon: '🌾',
    provinces: ['นครราชสีมา', 'ขอนแก่น', 'อุบลราชธานี', 'อุดรธานี', 'บุรีรัมย์', 'สุรินทร์', 'ร้อยเอ็ด', 'ศรีสะเกษ', 'สกลนคร', 'ชัยภูมิ', 'นครพนม', 'มหาสารคาม', 'เลย', 'กาฬสินธุ์', 'ยโสธร', 'มุกดาหาร', 'บึงกาฬ', 'หนองบัวลำภู', 'หนองคาย', 'อำนาจเจริญ'],
    viewBox: { x: 200, y: 120, width: 300, height: 320 },
  },
  central: {
    label: 'ภาคกลาง',
    icon: '🌊',
    provinces: ['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'สมุทรสาคร', 'สมุทรสงคราม', 'นครปฐม', 'พระนครศรีอยุธยา', 'อ่างทอง', 'สิงห์บุรี', 'ชัยนาท', 'ลพบุรี', 'สระบุรี', 'สุพรรณบุรี', 'นครนายก'],
    viewBox: { x: 120, y: 300, width: 140, height: 160 },
  },
  south: {
    label: 'ภาคใต้',
    icon: '🌴',
    provinces: ['ชุมพร', 'ระนอง', 'สุราษฎร์ธานี', 'พังงา', 'กระบี่', 'ภูเก็ต', 'นครศรีธรรมราช', 'ตรัง', 'พัทลุง', 'สตูล', 'สงขลา', 'ปัตตานี', 'ยะลา', 'นราธิวาส'],
    viewBox: { x: 20, y: 550, width: 260, height: 342.5 },
  },
  east_west: {
    label: 'ภาคตะวันออก/ตก',
    icon: '🌄',
    provinces: ['ชลบุรี', 'ระยอง', 'จันทบุรี', 'ตราด', 'ฉะเชิงเทรา', 'ปราจีนบุรี', 'สระแก้ว', 'กาญจนบุรี', 'ราชบุรี', 'เพชรบุรี', 'ประจวบคีรีขันธ์'],
    viewBox: { x: 60, y: 280, width: 300, height: 300 },
  },
};

export function MapPanel({ hometownData = [], workplaceData = [] }: MapPanelProps) {
  const [mode, setMode] = useState<MapMode>('hometown');
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);

  const activeData = mode === 'hometown' ? hometownData : workplaceData;

  // Filter data by region
  const filteredData = useMemo(() => {
    let list = activeData;
    const regionConf = REGION_CONFIG[selectedRegion];
    if (regionConf.provinces && regionConf.provinces.length > 0) {
      list = list.filter((p) => regionConf.provinces!.includes(p.province_name));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.province_name.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.company?.toLowerCase().includes(q) ||
          p.position?.toLowerCase().includes(q) ||
          p.generation?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeData, selectedRegion, searchQuery]);

  // Group alumni by province
  const peopleByProvince = useMemo(() => {
    const map = new Map<string, MapPoint[]>();
    for (const p of activeData) {
      const list = map.get(p.province_name) ?? [];
      list.push(p);
      map.set(p.province_name, list);
    }
    return map;
  }, [activeData]);

  // Sorted province ranking
  const sortedProvinces = useMemo(() => {
    return Array.from(peopleByProvince.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [peopleByProvince]);

  const maxCount = Math.max(1, ...Array.from(peopleByProvince.values()).map((v) => v.length));
  const totalCount = activeData.length;
  const provincesWithDataCount = sortedProvinces.filter(([_, list]) => list.length > 0).length;
  const topProvince = sortedProvinces[0] || null;

  // Color generator for heatmap
  function getProvinceFillColor(count: number, isSelected: boolean, isHovered: boolean) {
    if (isSelected) {
      return mode === 'hometown' ? '#4F46E5' : '#0D9488'; // Vibrant Indigo / Teal
    }
    if (isHovered) {
      return mode === 'hometown' ? '#818CF8' : '#2DD4BF';
    }
    if (count === 0) {
      return '#F8FAFC'; // Clean light slate
    }

    const ratio = count / maxCount;
    if (mode === 'hometown') {
      if (ratio > 0.6) return '#4338CA'; // Deep Indigo
      if (ratio > 0.35) return '#6366F1'; // Medium Indigo
      if (ratio > 0.15) return '#818CF8'; // Soft Indigo
      return '#C7D2FE'; // Very light Indigo
    } else {
      if (ratio > 0.6) return '#0F766E'; // Deep Teal
      if (ratio > 0.35) return '#0D9488'; // Medium Teal
      if (ratio > 0.15) return '#14B8A6'; // Soft Teal
      return '#99F6E4'; // Very light Teal
    }
  }

  // Active SVG ViewBox
  const baseViewBox = REGION_CONFIG[selectedRegion].viewBox || REGION_CONFIG.all.viewBox!;
  const currentViewBox = {
    x: baseViewBox.x + (baseViewBox.width * (1 - 1 / zoomScale)) / 2,
    y: baseViewBox.y + (baseViewBox.height * (1 - 1 / zoomScale)) / 2,
    width: baseViewBox.width / zoomScale,
    height: baseViewBox.height / zoomScale,
  };

  const provinceNames = Object.keys(THAILAND_PROVINCE_PATHS);

  // Selected province alumni list
  const selectedProvinceAlumni = selectedProvince ? peopleByProvince.get(selectedProvince) ?? [] : [];

  return (
    <div className="animate-slide-up space-y-6">
      {/* ─── Hero Header & Stats Banner ─────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-7 sm:p-8 text-white shadow-hero">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-purple-500/10 to-transparent pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md border border-white/15 text-indigo-200">
              <Compass className="h-3.5 w-3.5 text-indigo-300 animate-spin-slow" />
              <span>Interactive Alumni Network Map</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              แผนที่เครือข่ายศิษย์เก่าทั่วประเทศ 🗺️
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              สำรวจการกระจายตัวของศิษย์เก่าและนักศึกษา ทั้งถิ่นฐานบ้านเกิดและสถานที่ทำงานจริงทั่วประเทศไทย
            </p>
          </div>

          {/* Mode Switcher Toggle */}
          <div className="flex items-center gap-1.5 rounded-2xl bg-white/10 p-1.5 backdrop-blur-md border border-white/15 shrink-0">
            <button
              onClick={() => {
                setMode('hometown');
                setSelectedProvince(null);
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                mode === 'hometown'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>🏡 ภูมิลำเนา</span>
            </button>
            <button
              onClick={() => {
                setMode('workplace');
                setSelectedProvince(null);
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                mode === 'workplace'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>💼 ที่ทำงานศิษย์เก่า</span>
            </button>
          </div>
        </div>

        {/* ─── Metric Mini Badges ─────────────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-6 border-t border-white/10">
          <div className="rounded-2xl bg-white/5 p-3.5 backdrop-blur-xs border border-white/5">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-indigo-400" /> จำนวนบนแผนที่
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              {totalCount} <span className="text-xs font-normal text-slate-300">คน</span>
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 p-3.5 backdrop-blur-xs border border-white/5">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-teal-400" /> ครอบคลุม
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              {provincesWithDataCount} <span className="text-xs font-normal text-slate-300">/ 77 จังหวัด</span>
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 p-3.5 backdrop-blur-xs border border-white/5">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-amber-400" /> จังหวัดอันดับ 1
            </p>
            <p className="text-base sm:text-lg font-bold text-white mt-1 truncate">
              {topProvince ? topProvince[0] : '-'}
              {topProvince && (
                <span className="text-xs font-semibold text-amber-300 ml-1.5">({topProvince[1].length} คน)</span>
              )}
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 p-3.5 backdrop-blur-xs border border-white/5">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-pink-400" /> โหมดปัจจุบัน
            </p>
            <p className="text-base sm:text-lg font-bold text-white mt-1 truncate">
              {mode === 'hometown' ? 'บ้านเกิด (ศิษย์เก่า+นักศึกษา)' : 'ที่ทำงาน (เฉพาะศิษย์เก่า)'}
            </p>
          </div>
        </div>
      </section>

      {/* ─── Region Filter Chips & Quick Navigation ─────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(Object.keys(REGION_CONFIG) as RegionKey[]).map((rKey) => {
          const conf = REGION_CONFIG[rKey];
          const isActive = selectedRegion === rKey;
          return (
            <button
              key={rKey}
              onClick={() => {
                setSelectedRegion(rKey);
                setZoomScale(1);
              }}
              className={`flex items-center gap-1.5 shrink-0 rounded-2xl px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
                isActive
                  ? mode === 'hometown'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'bg-teal-600 text-white shadow-sm shadow-teal-200'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <span>{conf.icon}</span>
              <span>{conf.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Main Map & Directory Grid ─────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* Left Column: Interactive Map Canvas */}
        <div className="relative rounded-[32px] border border-slate-200/90 bg-white p-5 sm:p-6 shadow-card overflow-hidden flex flex-col justify-between min-h-[580px]">
          {/* Map Controls Header */}
          <div className="flex items-center justify-between gap-3 mb-3 z-10">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                {REGION_CONFIG[selectedRegion].label}
              </span>
              <span>•</span>
              <span>แตะที่จังหวัดเพื่อดูรายชื่อ</span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-100/90 rounded-2xl p-1 border border-slate-200/80">
              <button
                onClick={() => setZoomScale((z) => Math.min(z + 0.3, 2.5))}
                className="rounded-xl p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 transition-colors shadow-2xs"
                title="ขยายแผนที่"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => setZoomScale((z) => Math.max(z - 0.3, 0.8))}
                className="rounded-xl p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 transition-colors shadow-2xs"
                title="ย่อแผนที่"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={() => setZoomScale(1)}
                className="rounded-xl p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 transition-colors shadow-2xs"
                title="รีเซ็ตมุมมอง"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* SVG Map Container */}
          <div className="relative flex-1 flex items-center justify-center my-2">
            <svg
              viewBox={`${currentViewBox.x} ${currentViewBox.y} ${currentViewBox.width} ${currentViewBox.height}`}
              className="w-full h-auto max-h-[500px] transition-all duration-500 ease-out filter drop-shadow-xs"
            >
              <defs>
                <filter id="glow-selected" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={mode === 'hometown' ? '#4F46E5' : '#0D9488'} floodOpacity="0.5" />
                </filter>
                <filter id="circle-shadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.15" />
                </filter>
              </defs>

              {provinceNames.map((name) => {
                const count = peopleByProvince.get(name)?.length ?? 0;
                const isMetro = METRO_PROVINCES.includes(name);
                const isSelected = selectedProvince === name;
                const isHovered = hoveredProvince === name;
                const fill = getProvinceFillColor(count, isSelected, isHovered);

                return (
                  <path
                    key={name}
                    d={THAILAND_PROVINCE_PATHS[name]}
                    fill={fill}
                    stroke={
                      isSelected
                        ? '#FFFFFF'
                        : isMetro
                        ? '#F59E0B'
                        : isHovered
                        ? '#334155'
                        : '#CBD5E1'
                    }
                    strokeWidth={isSelected ? 2 : isMetro ? 1.2 : 0.4}
                    strokeLinejoin="round"
                    filter={isSelected ? 'url(#glow-selected)' : undefined}
                    onMouseEnter={() => setHoveredProvince(name)}
                    onMouseLeave={() => setHoveredProvince(null)}
                    onClick={() => setSelectedProvince(name === selectedProvince ? null : name)}
                    className="cursor-pointer transition-all duration-200 hover:opacity-95"
                  >
                    <title>{`${name}: ${count} คน`}</title>
                  </path>
                );
              })}

              {/* ─── CONNECTING DASHED LINE & METRO INSET (ไม่มีวงกลม เลื่อนลงมาด้านล่างไม่ทับแผนที่) ─── */}
              {selectedRegion === 'all' && (
                <g className="animate-fade-in transition-opacity duration-300">
                  {/* Yellow dashed connecting line */}
                  <line
                    x1="188"
                    y1="405"
                    x2="275"
                    y2="605"
                    stroke="#FACC15"
                    strokeWidth="2.5"
                    strokeDasharray="5 5"
                    strokeLinecap="round"
                    className="animate-pulse"
                  />

                  {/* Label Header */}
                  <text
                    x="350"
                    y="608"
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="800"
                    fill="#0F172A"
                  >
                    กรุงเทพมหานคร
                  </text>
                  <text
                    x="350"
                    y="623"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#64748B"
                  >
                    และปริมณฑล
                  </text>

                  {/* Nested Zoomed SVG Map of Metro Area without circle frame */}
                  <svg x="260" y="630" width="180" height="145" viewBox="140.2 364.5 84.4 66.4">
                    {METRO_PROVINCES.map((name) => {
                      const count = peopleByProvince.get(name)?.length ?? 0;
                      const isSelected = selectedProvince === name;
                      const isHovered = hoveredProvince === name;
                      const fill = getProvinceFillColor(count, isSelected, isHovered);

                      return (
                        <path
                          key={`metro-bubble-${name}`}
                          d={THAILAND_PROVINCE_PATHS[name]}
                          fill={fill}
                          stroke={isSelected ? '#FFFFFF' : '#D97706'}
                          strokeWidth={isSelected ? 1.8 : 0.9}
                          strokeLinejoin="round"
                          filter={isSelected ? 'url(#glow-selected)' : undefined}
                          onMouseEnter={() => setHoveredProvince(name)}
                          onMouseLeave={() => setHoveredProvince(null)}
                          onClick={() => setSelectedProvince(name === selectedProvince ? null : name)}
                          className="cursor-pointer transition-all duration-150 hover:opacity-90"
                        >
                          <title>{`${name}: ${count} คน`}</title>
                        </path>
                      );
                    })}
                  </svg>
                </g>
              )}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredProvince && (
              <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-2xl bg-slate-900/90 text-white px-4 py-2 text-xs font-bold shadow-xl backdrop-blur-md border border-white/10 animate-fade-in">
                <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                <span>{hoveredProvince}</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-extrabold text-white">
                  {peopleByProvince.get(hoveredProvince)?.length ?? 0} คน
                </span>
              </div>
            )}
          </div>

          {/* Map Legend Bar */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-semibold text-slate-700">ระดับความหนาแน่น:</span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-md bg-[#F8FAFC] border border-slate-200" /> 0 คน
              </span>
              <span className="flex items-center gap-1.5">
                <span className={`h-3 w-3 rounded-md ${mode === 'hometown' ? 'bg-[#C7D2FE]' : 'bg-[#99F6E4]'}`} /> น้อย
              </span>
              <span className="flex items-center gap-1.5">
                <span className={`h-3 w-3 rounded-md ${mode === 'hometown' ? 'bg-[#6366F1]' : 'bg-[#0D9488]'}`} /> ปานกลาง
              </span>
              <span className="flex items-center gap-1.5">
                <span className={`h-3 w-3 rounded-md ${mode === 'hometown' ? 'bg-[#4338CA]' : 'bg-[#0F766E]'}`} /> มาก
              </span>
            </div>

            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border-2 border-[#D97706] bg-white" />
              <span>กทม.-ปริมณฑล (ขยายล่างขวา)</span>
            </span>
          </div>
        </div>

        {/* Right Column: Alumni Directory / Province Details */}
        <div className="rounded-[32px] border border-slate-200/90 bg-white p-6 shadow-card flex flex-col justify-between min-h-[580px]">
          <div>
            {/* Search Box */}
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อศิษย์เก่า, จังหวัด, บริษัท หรือรุ่น..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-9 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* ─── STATE A: Province Selected Detail View ────────────────────── */}
            {selectedProvince ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-sm font-bold text-sm ${
                      mode === 'hometown' ? 'bg-indigo-600' : 'bg-teal-600'
                    }`}>
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-lg leading-snug">{selectedProvince}</h3>
                      <p className="text-xs text-slate-500">
                        {mode === 'hometown' ? 'ภูมิลำเนา' : 'ที่ทำงาน'} • {selectedProvinceAlumni.length} คน
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedProvince(null)}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    title="ปิดรายละเอียด"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Alumni Cards in Selected Province */}
                <div className="max-h-[420px] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                  {selectedProvinceAlumni.length === 0 && (
                    <div className="rounded-2xl bg-slate-50 p-8 text-center border border-dashed border-slate-200">
                      <p className="text-xs text-slate-400">ยังไม่มีข้อมูลในจังหวัดนี้</p>
                    </div>
                  )}

                  {selectedProvinceAlumni.map((alumnus) => (
                    <div
                      key={alumnus.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-indigo-100 hover:shadow-xs p-3.5 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          {alumnus.avatar_url ? (
                            <img
                              src={alumnus.avatar_url}
                              alt={alumnus.name}
                              className="h-10 w-10 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-100 to-purple-100 text-indigo-700 font-extrabold text-xs border border-indigo-200/60">
                              {alumnus.name.substring(0, 2)}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-slate-900 text-sm">{alumnus.name}</h4>
                              {alumnus.generation && (
                                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 border border-indigo-100">
                                  {alumnus.generation}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">
                              {alumnus.student_status === 'alumni' ? '🎓 ศิษย์เก่า' : '🎒 นักศึกษาปัจจุบัน'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {(alumnus.position || alumnus.company || alumnus.career_type) && (
                        <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap pt-1 border-t border-slate-200/50">
                          {alumnus.company && (
                            <span className="flex items-center gap-1 font-medium">
                              <Building2 className="h-3 w-3 text-slate-400" /> {alumnus.company}
                            </span>
                          )}
                          {alumnus.position && (
                            <span className="text-slate-400">• {alumnus.position}</span>
                          )}
                          {alumnus.career_type && (
                            <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              {alumnus.career_type}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* ─── STATE B: Ranked Province Distribution List ─────────────── */
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                    <span>ลำดับจังหวัดที่มีข้อมูล ({sortedProvinces.length})</span>
                  </h3>
                  <span className="text-xs text-slate-400">คลิกเพื่อดู</span>
                </div>

                <div className="max-h-[440px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {sortedProvinces.length === 0 && (
                    <div className="rounded-2xl bg-slate-50 p-8 text-center border border-dashed border-slate-200">
                      <p className="text-xs text-slate-400">ไม่พบข้อมูลที่ตรงกับคำค้นหา</p>
                    </div>
                  )}

                  {sortedProvinces.map(([provName, people], idx) => {
                    const count = people.length;
                    const percent = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                    const isMetro = METRO_PROVINCES.includes(provName);

                    return (
                      <div
                        key={provName}
                        onClick={() => setSelectedProvince(provName)}
                        className={`group relative overflow-hidden rounded-2xl border p-3.5 cursor-pointer transition-all hover:border-indigo-300 hover:shadow-xs active:scale-[0.99] ${
                          selectedProvince === provName
                            ? 'border-indigo-500 bg-indigo-50/40 shadow-xs'
                            : 'border-slate-100 bg-slate-50/40 hover:bg-white'
                        }`}
                      >
                        {/* Background Distribution Progress Bar */}
                        <div
                          className="absolute inset-y-0 left-0 bg-indigo-100/40 transition-all duration-500 rounded-r-xl"
                          style={{ width: `${percent}%` }}
                        />

                        <div className="relative z-10 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-white border border-slate-200 text-xs font-extrabold text-slate-500 shadow-2xs">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                                  {provName}
                                </span>
                                {isMetro && (
                                  <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-extrabold text-amber-700">
                                    กทม.
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {percent}% ของทั้งหมด
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                              count > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {count} คน
                            </span>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ─── Privacy Policy Notice ───────────────────────────────────── */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-400">
            <Info className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
            <span>
              ข้อมูลบนแผนที่แสดงเฉพาะสมาชิกที่เปิดการยินยอมในหน้าการตั้งค่าความเป็นส่วนตัว
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}