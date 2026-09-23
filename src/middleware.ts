import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { pool } from '@/lib/db';

// เส้นทางที่ไม่ต้องล็อกอิน
const PUBLIC_PATHS = ['/login', '/register', '/api/auth/login', '/api/auth/logout', '/api/auth/register', '/api/lookup/register-data'];

/**
 * ตรวจสอบว่า session_id cookie ยังใช้งานได้จริงหรือไม่ (มีอยู่ใน DB และยังไม่หมดอายุ)
 * เดิม proxy เช็กแค่ "มี cookie อยู่หรือไม่" ไม่ได้ตรวจกับ DB เลย — ทำให้ cookie ที่หมดอายุ/
 * ถูกลบไปแล้ว (เช่น logout จากเครื่องอื่น) ยังผ่านเข้าหน้าที่ต้องล็อกอินได้อยู่ (เห็นหน้าเว็บ
 * แวบก่อนโดน redirect ทีหลังจาก client fetch เจอ 401) Proxy ใน Next.js เวอร์ชันนี้รันบน
 * Node.js runtime เสมอ (ไม่ใช่ Edge) จึงคิวรี Postgres ตรงนี้ได้ปลอดภัย
 */
async function hasValidSession(sessionId: string | undefined): Promise<boolean> {
  if (!sessionId) return false;
  try {
    const { rows } = await pool.query(
      `SELECT 1 FROM sessions WHERE id = $1 AND expires_at > now() LIMIT 1`,
      [sessionId]
    );
    return rows.length > 0;
  } catch (err) {
    console.error('[proxy] session validation failed:', err);
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ข้ามไฟล์ static และ Next.js internal รวมถึง API รูปภาพ NAS
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/lookup') ||
    pathname.startsWith('/api/nas') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const sessionId = req.cookies.get('session_id')?.value;
  const isLoggedIn = await hasValidSession(sessionId);

  // ถ้าอยู่ที่หน้า /login หรือ /register และมี session ที่ใช้งานได้จริงอยู่แล้ว ให้ redirect ไปที่ /feed
  if (pathname === '/login' || pathname === '/register') {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/feed', req.url));
    }
    return NextResponse.next();
  }

  // ถ้าเข้า root / — ยังไม่ล็อกอินให้ไปหน้า login ก่อนเสมอ (หน้าเริ่มต้นของเว็บคือ login)
  // ล็อกอินแล้วค่อยพาไป /feed (เดิม redirect ไป /feed ตรงๆ แล้วค่อยเด้งไป /login อีกที
  // ทำให้เสีย request 2 รอบโดยไม่จำเป็นสำหรับคนที่ยังไม่ได้ล็อกอิน)
  if (pathname === '/') {
    return NextResponse.redirect(new URL(isLoggedIn ? '/feed' : '/login', req.url));
  }

  // เส้นทางที่ต้องการล็อกอิน
  if (!isLoggedIn) {
    // สำหรับ API routes ให้ส่งกลับเป็น JSON 401 Unauthorized เสมอ
    // ป้องกันไม่ให้ fetch ได้รับหน้าเว็บ HTML ของ /login แล้วเกิด SyntaxError Unexpected token '<'
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' },
        { status: 401 }
      );
    }

    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // ไฟล์นี้ชื่อ middleware.ts (ชื่อเดิมก่อนเปลี่ยนเป็น proxy.ts ใน Next.js 16) ซึ่ง
  // default เป็น Edge runtime เพื่อ backward-compat — ต้องระบุ nodejs ตรงๆ ไม่งั้น
  // pool.query() ข้างบน (ใช้ pg ซึ่งต้องพึ่ง Node's crypto/net module) จะพังทันที
  // ด้วย error "The edge runtime does not support Node.js 'crypto' module"
  runtime: 'nodejs',
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
