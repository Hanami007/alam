import { nasCatalogService } from '@/services/nas/catalog.service';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const genParam = searchParams.get('gen') || 'รุ่น 20';
    const subfolder = searchParams.get('sub') || '';
    const query = searchParams.get('q')?.toLowerCase().trim() || '';
    const codeParam = searchParams.get('code')?.trim() || '';

    const genNum = parseInt(genParam.replace(/[^0-9]/g, ''), 10) || 20;

    const [photos, generations] = await Promise.all([
      nasCatalogService.getPhotosForGeneration(genNum, subfolder),
      nasCatalogService.getGenerationsSummary(),
    ]);

    let filtered = photos;

    if (codeParam) {
      const cleanCode = codeParam.replace(/[^0-9]/g, '');
      filtered = filtered.filter((p) => p.personCode.includes(cleanCode) || p.studentId.includes(cleanCode));
    }

    if (query) {
      filtered = filtered.filter(
        (p) =>
          p.studentName.toLowerCase().includes(query) ||
          p.studentId.includes(query) ||
          p.personCode.includes(query) ||
          p.filename.toLowerCase().includes(query)
      );
    }

    const availableYears = generations.map((g) => g.year).sort((a, b) => a - b);

    return NextResponse.json({
      success: true,
      currentGen: `รุ่น ${genNum}`,
      currentSubfolder: subfolder,
      totalCount: filtered.length,
      photos: filtered,
      generations,
      availableYears,
    });
  } catch (err: any) {
    console.error('Error fetching NAS catalog:', err);
    return NextResponse.json({ error: err.message || 'Error fetching catalog' }, { status: 500 });
  }
}
