import { hofDbService } from '@/services/db/hof.service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const candidates = await hofDbService.getCandidates();
    return NextResponse.json(candidates);
  } catch (err: any) {
    console.error('[API /api/hof] Error:', err);
    return NextResponse.json({ error: err.message || 'ไม่สามารถโหลดข้อมูลศิษย์เก่าดีเด่นได้' }, { status: 500 });
  }
}
