import { getAlumniProfiles } from '@/lib/db';
import { HallOfFameGrid } from '@/modules/hall-of-fame/components/hall-of-fame-grid';
import { AppShell } from '@/components/layout/app-shell';

export default async function HallOfFamePage() {
  const profiles = await getAlumniProfiles();

  // แปลงชื่อ field ให้ตรงกับที่ HallOfFameGrid ต้องการ
  const candidates = profiles.map((p: any) => ({
    id: p.id,
    name: p.name,
    company: p.company,
    position: p.occupation,
    avatar_url: p.image,
    description: p.achievement,
    generation_label: p.generation,
  }));

  return (
    <AppShell>
      <HallOfFameGrid initialCandidates={candidates} />
    </AppShell>
  );
}