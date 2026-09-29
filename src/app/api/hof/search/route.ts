import { hofDbService } from '@/modules/hall-of-fame/services/hof.service';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') ?? '';

    if (q.trim() === '') {
      const profiles = await hofDbService.getCandidatesLegacyFormat();
      const results = profiles.map((p: any) => ({
        id: p.id,
        name: p.name,
        company: p.company || '',
        position: p.occupation || p.position || '',
        avatar_url: p.image || p.avatar_url || '',
        description: p.achievement || p.description || '',
        generation_label: p.generation || p.generation_label || '',
        votes: p.hof_points ?? 0,  // คะแนนจริงจาก DB (ไม่มี fake fallback)
      }));
      return NextResponse.json({ results });
    }

    const rows = await hofDbService.searchCandidatesLegacyFormat(q.trim());
    const results = rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      company: r.company || '',
      position: r.position || r.occupation || '',
      avatar_url: r.avatar_url || r.image || '',
      description: r.description || r.achievement || '',
      generation_label: r.generation_label || r.generation || '',
      votes: r.votes ?? r.hof_points ?? 0,  // คะแนนจริงจาก DB (ไม่มี fake fallback)
    }));

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error('Error in /api/hof/search:', err);
    return NextResponse.json({ error: err.message, results: [] }, { status: 500 });
  }
}