import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// เส้นทางที่ไม่ต้องล็อกอิน
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ข้ามไฟล์ static และ Next.js internal รวมถึง API รูปภาพ NAS
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/nas') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const sessionId = req.cookies.get('session_id')?.value;

  // ถ้าอยู่ที่หน้า /login และมี session อยู่แล้ว ให้ redirect ไปที่ /feed
  if (pathname === '/login') {
    if (sessionId) {
      return NextResponse.redirect(new URL('/feed', req.url));
    }
    return NextResponse.next();
  }

  // ถ้าเข้า root / ให้พาไป /feed (ถ้ามี session) หรือ /login (ถ้าไม่มี)
  if (pathname === '/') {
    if (sessionId) {
      return NextResponse.redirect(new URL('/feed', req.url));
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // เส้นทางที่ต้องการล็อกอิน
  if (!sessionId) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
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
