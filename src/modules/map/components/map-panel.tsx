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
  Smile,
  Heart,
  Award
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
    label: 'ทั่วประเทศ',
    icon: '🗺️',
    viewBox: { x: 0, y: 0, width: THAILAND_MAP_VIEWBOX.width, height: THAILAND_MAP_VIEWBOX.height },
  },
  metro: {
    label: 'กทม.-ปริมณฑล',
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
    label: 'ตะวันออก/ตก',
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

  const isHometown = mode === 'hometown';
  const activeData = isHometown ? hometownData : workplaceData;

  // Filter data by region & search query
  const filteredData = useMemo(() => {
    let list = activeData;
    const regionConf = REGION_CONFIG[selectedRegion];
    if (regionConf.provinces && regionConf.provinces.length > 0) {
      list = list.filter((p) => {
        const provName = p.province_name || (p as any).provinceName;
        return regionConf.provinces!.includes(provName);
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const provName = p.province_name || (p as any).provinceName || '';
        return (
          provName.toLowerCase().includes(q) ||
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.company && p.company.toLowerCase().includes(q)) ||
          (p.position && p.position.toLowerCase().includes(q)) ||
          (p.generation && p.generation.toLowerCase().includes(q))
        );
      });
    }
    return list;
  }, [activeData, selectedRegion, searchQuery]);

  // Group alumni by province
  const peopleByProvince = useMemo(() => {
    const map = new Map<string, MapPoint[]>();
    for (const p of activeData) {
      const pName = p.province_name || (p as any).provinceName;
      if (!pName) continue;
      const list = map.get(pName) ?? [];
      list.push(p);
      map.set(pName, list);
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

  // Pastel Color generator for Heatmap (Distinct Pastel Palette)
  function getProvinceFillColor(count: number, isSelected: boolean, isHovered: boolean) {
    if (isSelected) {
      return '#8B5CF6'; // ม่วงเน้นจังหวัดที่เลือก (Vibrant Violet Focus)
    }
    if (isHovered) {
      return '#DDD6FE'; // ลาเวนเดอร์พาสเทลสว่างตอน Hover
    }
    if (count === 0) {
      return '#F8FAFC'; // ขาวนวลสะอาด
    }

    // ระดับความหนาแน่น: พาสเทลต่างเฉดกันชัดเจน
    if (count >= 5 || (maxCount > 1 && count / maxCount > 0.55)) {
      return '#FB7185'; // พาสเทลชมพูกุหลาบ / คอรัล (หนาแน่น)
    }
    if (count >= 2 || (maxCount > 1 && count / maxCount > 0.25)) {
      return '#FDE047'; // พาสเทลเหลืองวนิลา / ส้มพีช (ปานกลาง)
    }
    return '#86EFAC'; // พาสเทลเขียวมิ้นต์ (น้อย)
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
  const selectedProvinceAlumni = selectedProvince ? peopleByProvince.get(selectedProvince) ?? [] : [];

  return (
    <div className="animate-fade-in space-y-6">
      {/* ─── 1. HERO HEADER: BALANCED GLASSMORPHISM ─────────────────── */}
      <section className={`relative overflow-hidden rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 text-white shadow-hero transition-all duration-500 ${
        isHometown
          ? 'bg-gradient-to-br from-indigo-950 via-purple-900/95 to-slate-900'
          : 'bg-gradient-to-br from-teal-950 via-emerald-900/95 to-slate-900'
      }`}>
        {/* Decorative Floating Glowing Orbs */}
        <div className={`absolute -top-12 -right-12 h-56 w-56 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
          isHometown ? 'bg-purple-400/25' : 'bg-teal-400/25'
        }`} />
        <div className={`absolute -bottom-10 -left-10 h-48 w-48 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
          isHometown ? 'bg-indigo-400/20' : 'bg-emerald-400/20'
        }`} />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold backdrop-blur-md border border-white/20 text-white shadow-xs">
              <Compass className={`h-3.5 w-3.5 animate-spin-slow ${isHometown ? 'text-indigo-300' : 'text-teal-300'}`} />
              <span>Interactive Alumni Network Map ✨</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
              แผนที่เครือข่ายศิษย์เก่าทั่วประเทศ 🗺️
            </h2>
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed font-medium">
              สำรวจการกระจายตัวของศิษย์เก่าและน้องๆ นักศึกษา ทั้งถิ่นฐานบ้านเกิดและสถานที่ทำงานจริงทั่วไทย
            </p>
          </div>

          {/* Pill Switcher สลับโหมด */}
          <div className="flex items-center gap-1.5 rounded-full bg-black/20 p-1.5 backdrop-blur-md border border-white/15 shadow-inner shrink-0 self-start md:self-auto">
            <button
              onClick={() => {
                setMode('hometown');
                setSelectedProvince(null);
              }}
              className={`group flex items-center gap-2 rounded-full px-4.5 py-2 text-xs sm:text-sm font-extrabold transition-all duration-300 cursor-pointer active:scale-95 ${
                isHometown
                  ? 'bg-white text-indigo-900 shadow-md scale-[1.02]'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="text-base transition-transform duration-200 group-hover:scale-120">🏡</span>
              <span>ภูมิลำเนา</span>
            </button>
            <button
              onClick={() => {
                setMode('workplace');
                setSelectedProvince(null);
              }}
              className={`group flex items-center gap-2 rounded-full px-4.5 py-2 text-xs sm:text-sm font-extrabold transition-all duration-300 cursor-pointer active:scale-95 ${
                !isHometown
                  ? 'bg-white text-teal-900 shadow-md scale-[1.02]'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="text-base transition-transform duration-200 group-hover:scale-120">💼</span>
              <span>ที่ทำงานศิษย์เก่า</span>
            </button>
          </div>
        </div>

        {/* ─── Metric Mini Bubbles ─────────────────────────────────────────── */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-5 border-t border-white/15">
          {/* Card 1 */}
          <div className="rounded-2xl bg-white/10 p-3.5 sm:p-4 backdrop-blur-md border border-white/15 hover:bg-white/15 transition-all duration-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-400/30 text-indigo-200">
                <Users className="h-4 w-4" />
              </div>
              <span>จำนวนบนแผนที่</span>
            </div>
            <p className="text-lg sm:text-2xl font-black text-white mt-1.5 tracking-tight">
              {totalCount} <span className="text-xs font-bold text-white/70">คน</span>
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl bg-white/10 p-3.5 sm:p-4 backdrop-blur-md border border-white/15 hover:bg-white/15 transition-all duration-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-teal-400/30 text-teal-200">
                <MapPin className="h-4 w-4" />
              </div>
              <span>ครอบคลุม</span>
            </div>
            <p className="text-lg sm:text-2xl font-black text-white mt-1.5 tracking-tight">
              {provincesWithDataCount} <span className="text-xs font-bold text-white/70">/ 77 จังหวัด</span>
            </p>
          </div>

          {/* Card 3: Top 1 Province */}
          <div className="rounded-2xl bg-white/10 p-3.5 sm:p-4 backdrop-blur-md border border-white/15 hover:bg-white/15 transition-all duration-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-400/30 text-amber-200">
                <Award className="h-4 w-4" />
              </div>
              <span>จังหวัดอันดับ 1 ✨</span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-white mt-1.5 truncate flex items-center gap-1.5">
              <span>{topProvince ? topProvince[0] : '-'}</span>
              {topProvince && (
                <span className="rounded-full bg-amber-400/30 text-amber-200 border border-amber-300/40 px-2 py-0.5 text-[10px] font-black">
                  {topProvince[1].length} คน
                </span>
              )}
            </p>
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl bg-white/10 p-3.5 sm:p-4 backdrop-blur-md border border-white/15 hover:bg-white/15 transition-all duration-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-400/30 text-pink-200">
                <Sparkles className="h-4 w-4" />
              </div>
              <span>โหมดแสดงผล</span>
            </div>
            <p className="text-xs sm:text-sm font-extrabold text-white mt-1.5 truncate">
              {isHometown ? '🏡 ภูมิลำเนา (ศิษย์เก่า+นศ.)' : '💼 ที่ทำงาน (ศิษย์เก่า)'}
            </p>
          </div>
        </div>
      </section>

      {/* ─── 2. REGION FILTER CAPSULES (ชิปเลือกภาคน่ารัก) ──────────────── */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        {(Object.keys(REGION_CONFIG) as RegionKey[]).map((rKey, idx) => {
          const conf = REGION_CONFIG[rKey];
          const isActive = selectedRegion === rKey;
          return (
            <button
              key={`region-btn-${rKey}-${idx}`}
              onClick={() => {
                setSelectedRegion(rKey);
                setZoomScale(1);
              }}
              className={`flex items-center gap-2 shrink-0 rounded-full px-4.5 py-2 text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer active:scale-95 ${
                isActive
                  ? isHometown
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105'
                    : 'bg-teal-600 text-white shadow-md shadow-teal-200 scale-105'
                  : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <span className="text-sm">{conf.icon}</span>
              <span>{conf.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── 3. MAIN MAP & DIRECTORY GRID ──────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] items-start">
        {/* Left Column: Interactive Pastel Map Canvas */}
        <div className="relative rounded-[36px] border border-slate-200/80 bg-white p-5 sm:p-7 shadow-card overflow-hidden flex flex-col justify-between min-h-[600px]">
          
          {/* Map Header Info & Zoom Controls */}
          <div className="flex items-center justify-between gap-3 mb-2 z-10">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 font-bold border border-slate-200/70">
                {REGION_CONFIG[selectedRegion].icon} {REGION_CONFIG[selectedRegion].label}
              </span>
              <span>•</span>
              <span className="text-slate-400">แตะที่จังหวัดเพื่อดูรายชื่อ 👆</span>
            </div>

            {/* Cute Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-100/90 rounded-full p-1 border border-slate-200/80 shadow-2xs">
              <button
                onClick={() => setZoomScale((z) => Math.min(z + 0.3, 2.5))}
                className="rounded-full p-1.5 text-slate-600 hover:bg-white hover:text-indigo-600 transition-all cursor-pointer shadow-2xs active:scale-90"
                title="ขยายแผนที่"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => setZoomScale((z) => Math.max(z - 0.3, 0.8))}
                className="rounded-full p-1.5 text-slate-600 hover:bg-white hover:text-indigo-600 transition-all cursor-pointer shadow-2xs active:scale-90"
                title="ย่อแผนที่"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={() => setZoomScale(1)}
                className="rounded-full p-1.5 text-slate-600 hover:bg-white hover:text-indigo-600 transition-all cursor-pointer shadow-2xs active:scale-90"
                title="รีเซ็ตมุมมอง"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* SVG Map Container */}
          <div className="relative flex-1 flex items-center justify-center my-3">
            <svg
              viewBox={`${currentViewBox.x} ${currentViewBox.y} ${currentViewBox.width} ${currentViewBox.height}`}
              className="w-full h-auto max-h-[510px] transition-all duration-500 ease-out filter drop-shadow-xs"
            >
              <defs>
                <filter id="glow-selected" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor={isHometown ? '#6366F1' : '#0D9488'} floodOpacity="0.5" />
                </filter>
                <filter id="glass-lens-shadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#0F172A" floodOpacity="0.12" />
                </filter>
              </defs>

              {provinceNames.map((name, idx) => {
                const count = peopleByProvince.get(name)?.length ?? 0;
                const isMetro = METRO_PROVINCES.includes(name);
                const isSelected = selectedProvince === name;
                const isHovered = hoveredProvince === name;
                const fill = getProvinceFillColor(count, isSelected, isHovered);

                return (
                  <path
                    key={`prov-path-${name}-${idx}`}
                    d={THAILAND_PROVINCE_PATHS[name]}
                    fill={fill}
                    stroke={
                      isSelected
                        ? '#FFFFFF'
                        : isMetro
                        ? '#F59E0B'
                        : isHovered
                        ? '#475569'
                        : '#CBD5E1'
                    }
                    strokeWidth={isSelected ? 2.2 : isMetro ? 1.4 : 0.45}
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

              {/* ─── GLASS LENS: BANGKOK & METRO MAGNIFIER INSET ─── */}
              {selectedRegion === 'all' && (
                <g className="animate-fade-in transition-opacity duration-300">
                  {/* Smooth curved connecting line */}
                  <path
                    d="M 188 405 Q 220 520 275 605"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2.2"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                    className="animate-pulse"
                  />

                  {/* Magnifier Glass Lens Circular Backdrop */}
                  <circle
                    cx="350"
                    cy="700"
                    r="85"
                    fill="#FFFFFF"
                    fillOpacity="0.95"
                    stroke="#F59E0B"
                    strokeWidth="2.5"
                    filter="url(#glass-lens-shadow)"
                  />

                  {/* Lens Header Label */}
                  <text
                    x="350"
                    y="635"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="900"
                    fill="#1E293B"
                  >
                    🔍 กทม. และปริมณฑล
                  </text>

                  {/* Metro SVG Inset Paths */}
                  <svg x="265" y="642" width="170" height="135" viewBox="140.2 364.5 84.4 66.4">
                    {METRO_PROVINCES.map((name, idx) => {
                      const count = peopleByProvince.get(name)?.length ?? 0;
                      const isSelected = selectedProvince === name;
                      const isHovered = hoveredProvince === name;
                      const fill = getProvinceFillColor(count, isSelected, isHovered);

                      return (
                        <path
                          key={`metro-bubble-${name}-${idx}`}
                          d={THAILAND_PROVINCE_PATHS[name]}
                          fill={fill}
                          stroke={isSelected ? '#FFFFFF' : '#D97706'}
                          strokeWidth={isSelected ? 2 : 0.9}
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

            {/* Hover Balloon Tooltip 🎈 */}
            {hoveredProvince && (
              <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full bg-slate-900/90 text-white px-4 py-2 text-xs font-bold shadow-xl backdrop-blur-md border border-white/15 animate-pop-in">
                <span className="text-sm">🎈</span>
                <span>{hoveredProvince}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${
                  isHometown ? 'bg-indigo-500 text-white' : 'bg-teal-500 text-white'
                }`}>
                  {peopleByProvince.get(hoveredProvince)?.length ?? 0} คน
                </span>
              </div>
            )}
          </div>

          {/* Map Legend Bar */}
          <div className="mt-3 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-3.5 flex-wrap">
              <span className="font-bold text-slate-700">ระดับความหนาแน่น:</span>
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-full bg-[#F8FAFC] border border-slate-300 shadow-2xs" /> 0 คน
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-full bg-[#86EFAC] border border-emerald-300 shadow-2xs" /> น้อย
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-full bg-[#FDE047] border border-amber-300 shadow-2xs" /> ปานกลาง
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-full bg-[#FB7185] border border-rose-300 shadow-2xs" /> หนาแน่น
              </span>
            </div>

            <span className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
              <span>กทม.-ปริมณฑล (ขยายล่างขวา)</span>
            </span>
          </div>
        </div>

        {/* Right Column: Alumni Directory / Province Details */}
        <div className="rounded-[36px] border border-slate-200/80 bg-white p-6 sm:p-7 shadow-card flex flex-col justify-between min-h-[600px]">
          <div>
            {/* Search Box */}
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อศิษย์เก่า, จังหวัด, บริษัท หรือรุ่น..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-9 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* ─── STATE A: Selected Province Details ───────────────────────── */}
            {selectedProvince ? (
              <div className="space-y-4 animate-fade-in">
                {/* Header with dismiss button */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-xs font-bold text-base ${
                      isHometown ? 'bg-indigo-600' : 'bg-teal-600'
                    }`}>
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-lg leading-snug">{selectedProvince}</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {isHometown ? '🏡 ภูมิลำเนา' : '💼 ที่ทำงาน'} • <span className="font-bold text-slate-700">{selectedProvinceAlumni.length} คน</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedProvince(null)}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                    title="ปิดรายละเอียด"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Alumni Cards with Cute Sticker Tags */}
                <div className="max-h-[420px] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                  {selectedProvinceAlumni.length === 0 && (
                    <div className="rounded-3xl bg-slate-50 p-8 text-center border border-dashed border-slate-200">
                      <span className="text-3xl">🧭</span>
                      <p className="text-xs text-slate-400 mt-2 font-medium">ยังไม่มีสมาชิกปักหมุดในจังหวัดนี้</p>
                    </div>
                  )}

                  {selectedProvinceAlumni.map((alumnus, idx) => (
                    <div
                      key={`alumnus-card-${alumnus.id || idx}-${alumnus.name}-${idx}`}
                      className="rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-indigo-200 hover:shadow-xs p-3.5 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          {alumnus.avatar_url ? (
                            <img
                              src={alumnus.avatar_url}
                              alt={alumnus.name}
                              className="h-10 w-10 rounded-2xl object-cover ring-2 ring-slate-100 shrink-0"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-100 to-purple-100 text-indigo-700 font-extrabold text-xs border border-indigo-200/60 shadow-2xs">
                              {alumnus.name ? alumnus.name.substring(0, 2) : 'ศก'}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-slate-900 text-sm sm:text-base">{alumnus.name}</h4>
                              {alumnus.generation && (
                                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-600 border border-indigo-100">
                                  🏷️ {alumnus.generation}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {alumnus.student_status === 'alumni' ? '🎓 ศิษย์เก่า' : '🎒 นักศึกษาปัจจุบัน'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {(alumnus.position || alumnus.company || alumnus.career_type) && (
                        <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap pt-1.5 border-t border-slate-200/50">
                          {alumnus.company && (
                            <span className="flex items-center gap-1 font-semibold text-slate-700">
                              <Building2 className="h-3.5 w-3.5 text-slate-400" /> {alumnus.company}
                            </span>
                          )}
                          {alumnus.position && (
                            <span className="text-slate-500">• {alumnus.position}</span>
                          )}
                          {alumnus.career_type && (
                            <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
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
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                    <TrendingUp className={`h-4 w-4 ${isHometown ? 'text-indigo-600' : 'text-teal-600'}`} />
                    <span>อันดับจังหวัดที่มีข้อมูล ({sortedProvinces.length})</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">แตะเพื่อดูรายชื่อ</span>
                </div>

                <div className="max-h-[440px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {sortedProvinces.length === 0 && (
                    <div className="rounded-3xl bg-slate-50 p-8 text-center border border-dashed border-slate-200">
                      <span className="text-3xl">🔍</span>
                      <p className="text-xs text-slate-400 mt-2 font-medium">ไม่พบข้อมูลที่ตรงกับคำค้นหา</p>
                    </div>
                  )}

                  {sortedProvinces.map(([provName, people], idx) => {
                    const count = people.length;
                    const percent = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                    const isMetro = METRO_PROVINCES.includes(provName);

                    return (
                      <div
                        key={`sorted-prov-${provName}-${idx}`}
                        onClick={() => setSelectedProvince(provName)}
                        className={`group relative overflow-hidden rounded-2xl border p-3.5 cursor-pointer transition-all duration-200 hover:shadow-xs active:scale-[0.99] ${
                          selectedProvince === provName
                            ? isHometown
                              ? 'border-indigo-400 bg-indigo-50/50 shadow-xs'
                              : 'border-teal-400 bg-teal-50/50 shadow-xs'
                            : 'border-slate-100 bg-slate-50/40 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        {/* Soft Pastel Distribution Progress Bar */}
                        <div
                          className={`absolute inset-y-0 left-0 transition-all duration-500 rounded-r-xl ${
                            isHometown ? 'bg-indigo-100/50' : 'bg-teal-100/50'
                          }`}
                          style={{ width: `${percent}%` }}
                        />

                        <div className="relative z-10 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className={`flex h-6 w-6 items-center justify-center rounded-xl text-xs font-black shadow-2xs ${
                              idx === 0
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : idx === 1
                                ? 'bg-slate-200 text-slate-700'
                                : idx === 2
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-white text-slate-500 border border-slate-200'
                            }`}>
                              {idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                                  {provName}
                                </span>
                                {isMetro && (
                                  <span className="rounded-md bg-amber-100 px-1.5 py-0.2 text-[9px] font-black text-amber-800">
                                    กทม.
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {percent}% ของเครือข่ายทั้งหมด
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-3 py-0.5 text-xs font-black ${
                              count > 0
                                ? isHometown
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : 'bg-teal-100 text-teal-700'
                                : 'bg-slate-100 text-slate-500'
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
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-400 font-medium">
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