// วางไฟล์นี้ที่ src/app/map/page.tsx
import { getHometownMapData, getWorkplaceMapData } from '@/lib/db';
import { MapPanel } from '@/modules/map/components/map-panel';
import { AppShell } from '@/components/layout/app-shell';

export default async function MapPage() {
  const [hometownData, workplaceData] = await Promise.all([
    getHometownMapData(),
    getWorkplaceMapData(),
  ]);

  return (
    <AppShell>
      <MapPanel hometownData={hometownData} workplaceData={workplaceData} />
    </AppShell>
  );
}