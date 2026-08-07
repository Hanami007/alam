// วางไฟล์นี้ที่ src/app/api/hof/search/route.ts
import { searchHofCandidates, getAlumniProfiles } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const results = q.trim() === '' ? await getAlumniProfiles() : await searchHofCandidates(q);
  return NextResponse.json({ results });
}