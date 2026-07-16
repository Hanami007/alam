import { MapPin, Users } from 'lucide-react';

const provinces = [
  { name: 'Bangkok', count: 3200, type: 'Private Company' },
  { name: 'Chiang Mai', count: 1180, type: 'Business Owner' },
  { name: 'Khon Kaen', count: 870, type: 'Academic' },
  { name: 'Chonburi', count: 1020, type: 'Government' },
];

export function MapPanel() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Interactive map</p>
            <h2 className="text-xl font-semibold text-slate-900">Thailand alumni distribution</h2>
          </div>
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
            <MapPin className="h-5 w-5" />
          </div>
        </div>
        <div className="flex h-[420px] items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50 text-center text-sm text-slate-500">
          OpenStreetMap layer ready for React Leaflet integration.
        </div>
      </div>
      <div className="space-y-4">
        {provinces.map((province) => (
          <div key={province.name} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{province.name}</p>
                <p className="mt-1 text-sm text-slate-500">{province.type}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-blue-600">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900">{province.count.toLocaleString()}</p>
            <p className="mt-1 text-sm text-slate-500">alumni connected</p>
          </div>
        ))}
      </div>
    </div>
  );
}
