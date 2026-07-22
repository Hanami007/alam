import { MapPin, TrendingUp } from 'lucide-react';
import { getRegionStats } from '@/lib/db';
import { THAILAND_PROVINCES, THAILAND_VIEWBOX } from '@/lib/thailand-map-data';

export async function MapPanel() {
  const regions = await getRegionStats();
  const countByRegion = new Map(regions.map((r) => [r.region, r.count]));
  const maxCount = Math.max(...regions.map((r) => r.count), 1);
  const topRegion = [...regions].sort((a, b) => b.count - a.count)[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[28px] border border-white bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#0099FF]">แผนที่ประเทศไทย</p>
            <h2 className="text-xl font-semibold text-slate-900">การกระจายตัวศิษย์เก่าตามภูมิภาค</h2>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0099FF] to-[#1E90FF] text-white shadow-md shadow-[#0099FF]/25">
            <MapPin className="h-5 w-5" />
          </div>
        </div>

        <div className="flex justify-center rounded-[24px] bg-gradient-to-br from-[#F5FAFF] to-[#EAF6FF] p-4">
          {/* วาดจากรูปทรงจังหวัดจริง แต่ระบายสีตาม "ภาค" ที่จังหวัดนั้นสังกัด ไม่แยกสีรายจังหวัด
              จึงเห็นเป็นก้อนสีตามภูมิภาค 6 ภาคของประเทศไทยจริง ไม่ใช่กล่องสี่เหลี่ยมจำลอง */}
          <svg viewBox={THAILAND_VIEWBOX} className="h-[560px] w-full max-w-[380px]">
            {THAILAND_PROVINCES.map((province) => {
              const count = countByRegion.get(province.region) ?? 0;
              const intensity = count / maxCount;
              const fill = count > 0 ? `rgba(0, 153, 255, ${0.18 + intensity * 0.72})` : '#DCEAF5';
              return (
                <path key={province.name} d={province.d} fill={fill} stroke={fill} strokeWidth={1}>
                  <title>
                    ภาค{province.region}: {count.toLocaleString()} คน
                  </title>
                </path>
              );
            })}
          </svg>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          * สีเข้มขึ้นตามจำนวนศิษย์เก่าในภูมิภาคนั้น แบ่งตาม 6 ภาคของประเทศไทย ชี้ที่แผนที่เพื่อดูจำนวนคน
        </p>
      </div>

      <div className="space-y-4">
        {topRegion ? (
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#0099FF] to-[#6495ED] p-5 text-white shadow-lg shadow-[#0099FF]/25">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/85">
              <TrendingUp className="h-3.5 w-3.5" /> ภูมิภาคอันดับ 1
            </div>
            <p className="mt-2 text-lg font-bold">ภาค{topRegion.region}</p>
            <p className="text-sm text-white/85">{topRegion.count.toLocaleString()} คน</p>
          </div>
        ) : null}

        {[...regions]
          .sort((a, b) => b.count - a.count)
          .map((stat) => {
            const pct = Math.round(((stat.count ?? 0) / maxCount) * 100);
            return (
              <div key={stat.region} className="rounded-2xl border border-white bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">ภาค{stat.region}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.count.toLocaleString()}</p>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EAF6FF]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#0099FF] to-[#33CCFF]" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-slate-400">ศิษย์เก่าในภูมิภาคนี้</p>
              </div>
            );
          })}
      </div>
    </div>
  );
}