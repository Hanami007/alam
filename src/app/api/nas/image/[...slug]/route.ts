import { NextResponse } from 'next/server';
import { synologyApi } from '@/services/nas/synology-api.service';

/**
 * สร้างภาพ SVG ชุดครุยแม่โจ้ (พื้นหลังสีฟ้า แถบเขียว-ส้ม) เสมือนจริง
 * เป็น Fallback ชั่วคราวเมื่อไม่มีรูปใน NAS
 */
function generateGraduationPortraitSvg(studentId: string, name: string, code3: string, genLabel: string): string {
  const hash = studentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const isFemale = hash % 2 === 0;
  const hairColor = ['#1e293b', '#0f172a', '#292524', '#172554'][hash % 4];
  const skinTone = ['#fde047', '#fed7aa', '#fecdd3', '#fcd34d'][hash % 4];

  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520" width="100%" height="100%">
    <defs>
      <radialGradient id="studioBlue" cx="50%" cy="40%" r="70%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="50%" stop-color="#0284c7" />
        <stop offset="100%" stop-color="#0369a1" />
      </radialGradient>
      
      <linearGradient id="maejoGreen" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#15803d" />
        <stop offset="50%" stop-color="#166534" />
        <stop offset="100%" stop-color="#14532d" />
      </linearGradient>

      <linearGradient id="scienceGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fb923c" />
        <stop offset="50%" stop-color="#ea580c" />
        <stop offset="100%" stop-color="#c2410c" />
      </linearGradient>

      <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="6" stdDeviation="6" flood-opacity="0.25" />
      </filter>
    </defs>

    <rect width="400" height="520" fill="url(#studioBlue)" />

    <g filter="url(#softShadow)">
      <path d="M 60 520 L 90 350 L 150 280 L 250 280 L 310 350 L 340 520 Z" fill="#0f172a" />
      <path d="M 120 520 L 150 320 L 175 320 L 155 520 Z" fill="url(#maejoGreen)" />
      <path d="M 280 520 L 250 320 L 225 320 L 245 520 Z" fill="url(#maejoGreen)" />

      <path d="M 150 320 L 200 370 L 250 320 L 235 305 L 200 340 L 165 305 Z" fill="url(#scienceGold)" />
      
      <circle cx="190" cy="390" r="7" fill="#ea580c" />
      <circle cx="210" cy="390" r="7" fill="#ea580c" />
      <path d="M 188 395 L 186 440 L 194 440 L 192 395 Z" fill="#f97316" />
      <path d="M 208 395 L 206 440 L 214 440 L 212 395 Z" fill="#f97316" />

      <polygon points="175,280 200,320 225,280 215,260 185,260" fill="#ffffff" />
      <polygon points="194,290 206,290 203,335 197,335" fill="#1e3a8a" />

      <rect x="175" y="220" width="50" height="50" rx="10" fill="${skinTone}" />
      <ellipse cx="200" cy="180" rx="55" ry="70" fill="${skinTone}" />

      ${
        isFemale
          ? `
          <path d="M 130 180 Q 130 90 200 85 Q 270 90 270 180 Q 280 260 260 270 Q 255 190 245 160 Q 200 130 155 160 Q 145 190 140 270 Q 120 260 130 180 Z" fill="${hairColor}" />
          <path d="M 145 140 Q 200 110 255 140 Q 200 120 145 140 Z" fill="${hairColor}" />
        `
          : `
          <path d="M 135 170 Q 135 90 200 85 Q 265 90 265 170 Q 260 115 200 105 Q 140 115 135 170 Z" fill="${hairColor}" />
        `
      }

      <ellipse cx="180" cy="175" rx="5" ry="3" fill="#1e293b" />
      <ellipse cx="220" cy="175" rx="5" ry="3" fill="#1e293b" />
      <path d="M 172 165 Q 180 160 188 165" stroke="#334155" stroke-width="2.5" fill="none" />
      <path d="M 212 165 Q 220 160 228 165" stroke="#334155" stroke-width="2.5" fill="none" />
      <path d="M 197 185 L 203 185 L 200 195 Z" fill="#d97706" opacity="0.6" />
      <path d="M 188 210 Q 200 222 212 210" stroke="#b91c1c" stroke-width="2.5" stroke-linecap="round" fill="none" />
    </g>

    <rect x="0" y="475" width="400" height="45" fill="rgba(15, 23, 42, 0.75)" />
    <text x="200" y="502" fill="#ffffff" font-size="16" font-weight="bold" font-family="sans-serif" text-anchor="middle">
      ${genLabel}
    </text>
  </svg>
  `;
}

export async function GET(
  req: Request,
  { params }: { params?: Promise<{ slug: string[] }> }
) {
  try {
    const slugParams = params ? await params : { slug: [] };
    const slug = slugParams.slug || [];
    const { searchParams } = new URL(req.url);

    // 1. ถ้าส่งมาเป็น query parameter path ตรงๆ เช่น ?path=รุ่น 28/ธรรมเนียบ/6504101302.JPG
    const explicitPath = searchParams.get('path');
    if (explicitPath) {
      const decodedPath = decodeURIComponent(explicitPath);
      const result = await synologyApi.downloadFile(decodedPath);
      if (result) {
        return new NextResponse(result.buffer, {
          status: 200,
          headers: {
            'Content-Type': result.contentType,
            'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
          },
        });
      }
    }

    let genInput = searchParams.get('gen') || '';
    let codeInput = searchParams.get('code') || '';
    let albumType = searchParams.get('album') || '';

    if (slug && slug.length >= 3) {
      genInput = decodeURIComponent(slug[0]);
      albumType = decodeURIComponent(slug[1]);
      codeInput = decodeURIComponent(slug[2]);
    } else if (slug && slug.length === 2) {
      genInput = decodeURIComponent(slug[0]);
      codeInput = decodeURIComponent(slug[1]);
    } else if (slug && slug.length === 1) {
      codeInput = decodeURIComponent(slug[0]);
    }

    const genNumberMatch = genInput.match(/\d+/);
    const genNumber = genNumberMatch ? parseInt(genNumberMatch[0], 10) : 20;
    const genFolderName = genNumber === 32 ? 'รุ่น32' : `รุ่น ${genNumber}`;
    const yearPrefix = String(genNumber + 37);

    const cleanCode = codeInput.replace(/[^0-9]/g, '');
    const code3 = cleanCode.length >= 3 ? cleanCode.slice(-3) : cleanCode.padStart(3, '0');
    const fullStudentId = cleanCode.length === 10 ? cleanCode : `${yearPrefix}04101${code3}`;

    // รายการ Path รูปแบบต่างๆ ที่เป็นไปได้ใน Synology FileStation
    const candidatePaths: string[] = [];
    const extensions = ['jpg', 'JPG', 'jpeg', 'JPEG', 'png', 'PNG'];
    const subfolderNames = [
      '',
      `${genNumber}_ชุดครุย`,
      'ชุดครุย',
      'รูปหน้าตรง',
      'รูปนศ',
      'ธรรมเนียบ',
      `รูปบัตร นศ. ${genNumber}`,
      'ทางการ',
      'Free',
      'ถ่ายรูปหมู่',
      '01-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-70', '71-80', '81-84',
    ];

    if (albumType && !subfolderNames.includes(albumType)) {
      subfolderNames.unshift(albumType);
    }

    for (const sub of subfolderNames) {
      const subPart = sub ? `${sub}/` : '';
      for (const ext of extensions) {
        candidatePaths.push(`${genFolderName}/${subPart}${fullStudentId}.${ext}`);
        candidatePaths.push(`${genFolderName}/${subPart}${code3}.${ext}`);
        candidatePaths.push(`${genFolderName}/${subPart}${fullStudentId} (1).${ext}`);
        candidatePaths.push(`${genFolderName}/${subPart}${code3} (1).${ext}`);
      }
    }

    // ดึงรูปจริงจาก Synology NAS WebAPI
    for (const relPath of candidatePaths) {
      const result = await synologyApi.downloadFile(relPath);
      if (result) {
        return new NextResponse(result.buffer, {
          status: 200,
          headers: {
            'Content-Type': result.contentType,
            'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
          },
        });
      }
    }

    // Fallback: ภาพชุดครุยแม่โจ้ SVG
    const svgContent = generateGraduationPortraitSvg(
      fullStudentId,
      `ศิษย์เก่ารุ่น ${genNumber}`,
      `#${code3}`,
      `รุ่น ${genNumber}`
    );

    return new NextResponse(svgContent, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err) {
    console.error('[NAS Image Proxy Error]:', err);
    const fallbackSvg = generateGraduationPortraitSvg('5704101301', 'ศิษย์เก่า', '#301', 'รุ่น 20');
    return new NextResponse(fallbackSvg, {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'no-cache, no-store' },
    });
  }
}
