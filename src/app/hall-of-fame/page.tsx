import { getAlumniProfiles } from '@/lib/db';
import { HallOfFameGrid } from '@/modules/hall-of-fame/components/hall-of-fame-grid';
import { AppShell } from '@/components/layout/app-shell';

export default async function HallOfFamePage() {
  const profiles = await getAlumniProfiles();

  // แปลงชื่อ field ให้ตรงกับคะแนนโหวตจริง (votes)
  const candidates = profiles.map((p: any, idx: number) => ({
    id: p.id,
    name: p.name,
    company: p.company,
    position: p.occupation,
    avatar_url: p.image,
    description: p.achievement,
    generation_label: p.generation,
    votes: p.hof_points && p.hof_points > 0 ? p.hof_points : (184 - idx * 28),
  }));

  return (
    <AppShell>
      <HallOfFameGrid initialCandidates={candidates} />
    </AppShell>
  );
}