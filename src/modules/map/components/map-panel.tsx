'use client';
import { useState, useMemo } from 'react';
import { THAILAND_PROVINCE_PATHS, THAILAND_MAP_VIEWBOX } from '@/lib/thailand-province-paths';

type MapMode = 'hometown' | 'workplace';
type RegionFilter = 'all' | 'metro' | 'provincial';

interface MapPoint {
  id: number;
  name: string;
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

// bounding box ของกลุ่มกรุงเทพฯ-ปริมณฑล คำนวณไว้ล่วงหน้าจาก path จริง (มี padding เผื่อขอบ)
const METRO_VIEWBOX = { x: 140.2, y: 364.5, width: 84.4, height: 66.4 };
const FULL_VIEWBOX = { x: 0, y: 0, width: THAILAND_MAP_VIEWBOX.width, height: THAILAND_MAP_VIEWBOX.height };

export function MapPanel({ hometownData, workplaceData }: MapPanelProps) {
  const [mode, setMode] = useState<MapMode>('hometown');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const activeData = mode === 'hometown' ? hometownData : workplaceData;

  const filteredData = useMemo(() => {
    if (regionFilter === 'all') return activeData;
    if (regionFilter === 'metro') return activeData.filter((p) => p.metro);
    return activeData.filter((p) => !p.metro);
  }, [activeData, regionFilter]);

  // จัดกลุ่มคนตามจังหวัด (สำหรับ list ด้านขวา)
  const peopleByProvince = useMemo(() => {
    const map = new Map<string, MapPoint[]>();
    for (const p of filteredData) {
      const list = map.get(p.province_name) ?? [];
      list.push(p);
      map.set(p.province_name, list);
    }
    return map;
  }, [filteredData]);

  const sortedProvinces = useMemo(
    () => Array.from(peopleByProvince.entries()).sort((a, b) => b[1].length - a[1].length),
    [peopleByProvince]
  );

  const maxCount = Math.max(1, ...Array.from(peopleByProvince.values()).map((v) => v.length));

  function fillColor(count: number) {
    if (count === 0) return '#F1F5F9';
    const intensity = Math.min(count / maxCount, 1);
    if (intensity > 0.66) return '#2563EB';
    if (intensity > 0.33) return '#60A5FA';
    return '#BFDBFE';
  }

  const provinceNames = Object.keys(THAILAND_PROVINCE_PATHS);
  const viewBox = regionFilter === 'metro' ? METRO_VIEWBOX : FULL_VIEWBOX;
  const visibleProvinces =
    regionFilter === 'metro'
      ? provinceNames.filter((n) => METRO_PROVINCES.includes(n))
      : regionFilter === 'provincial'
      ? provinceNames.filter((n) => !METRO_PROVINCES.includes(n))
      : provinceNames;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setMode('hometown')} className={mode === 'hometown' ? 'btn-primary' : 'btn-secondary'}>
          ภูมิลำเนา
        </button>
        <button onClick={() => setMode('workplace')} className={mode === 'workplace' ? 'btn-primary' : 'btn-secondary'}>
          ที่ทำงานศิษย์เก่า
        </button>
      </div>

      <div className="flex gap-2 text-sm">
        <button onClick={() => setRegionFilter('all')} className={regionFilter === 'all' ? 'font-semibold text-blue-600' : 'text-slate-500'}>
          ทั้งหมด
        </button>
        <button onClick={() => setRegionFilter('metro')} className={regionFilter === 'metro' ? 'font-semibold text-blue-600' : 'text-slate-500'}>
          กรุงเทพฯ-ปริมณฑล (ซูม)
        </button>
        <button onClick={() => setRegionFilter('provincial')} className={regionFilter === 'provincial' ? 'font-semibold text-blue-600' : 'text-slate-500'}>
          ต่างจังหวัด
        </button>
      </div>

      <p className="text-sm text-slate-500">
        {mode === 'hometown' ? 'แสดงจังหวัดภูมิลำเนา' : 'แสดงจังหวัดที่ทำงาน (เฉพาะศิษย์เก่า)'} · {filteredData.length} คน (เฉพาะคนที่ยินยอมแสดงข้อมูล)
      </p>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* แผนที่ */}
        <div className="relative rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <svg
            viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
            className="mx-auto h-auto w-full max-w-md transition-all duration-300"
          >
            {visibleProvinces.map((name) => {
              const count = peopleByProvince.get(name)?.length ?? 0;
              const isMetro = METRO_PROVINCES.includes(name);
              const isSelected = selected === name;
              return (
                <path
                  key={name}
                  d={THAILAND_PROVINCE_PATHS[name]}
                  fill={fillColor(count)}
                  stroke={isSelected ? '#1D4ED8' : isMetro ? '#F59E0B' : '#94A3B8'}
                  strokeWidth={isSelected ? 1.5 : isMetro ? 1.2 : 0.4}
                  onMouseEnter={() => setHovered(name)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected(name === selected ? null : name)}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                >
                  <title>{`${name}: ${count} คน`}</title>
                </path>
              );
            })}
          </svg>

          {hovered && (
            <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white shadow-lg">
              {hovered} · {peopleByProvince.get(hovered)?.length ?? 0} คน
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded" style={{ background: '#F1F5F9' }} /> ไม่มีข้อมูล</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded" style={{ background: '#BFDBFE' }} /> น้อย</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded" style={{ background: '#60A5FA' }} /> ปานกลาง</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded" style={{ background: '#2563EB' }} /> มาก</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded border-2" style={{ borderColor: '#F59E0B' }} /> กรุงเทพฯ-ปริมณฑล</span>
          </div>
        </div>

        {/* รายชื่อคนตามจังหวัด */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">รายชื่อตามจังหวัด</h3>
          <div className="mt-3 max-h-[480px] space-y-2 overflow-y-auto">
            {sortedProvinces.length === 0 && (
              <p className="text-sm text-slate-400">ยังไม่มีข้อมูลในกลุ่มนี้</p>
            )}
            {sortedProvinces.map(([province, people]) => (
              <div
                key={province}
                className={`rounded-xl border p-3 cursor-pointer transition-colors ${
                  selected === province ? 'border-blue-400 bg-blue-50' : 'border-slate-100 hover:bg-slate-50'
                }`}
                onClick={() => setSelected(province === selected ? null : province)}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">{province}</p>
                  <span className="text-xs text-slate-500">{people.length} คน</span>
                </div>
                {selected === province && (
                  <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                    {people.map((p) => (
                      <li key={p.id} className="text-sm text-slate-600">{p.name}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}