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
    // ต้องเป็นบัญชีที่ยัง approved อยู่ด้วย — ไม่งั้นคนที่ถูกแอดมินปฏิเสธ/ระงับภายหลัง
    // จะยังใช้ session เดิมต่อได้อีกจนกว่า session จะหมดอายุ (สูงสุด 30 วัน)
    const { rows } = await pool.query(
      `SELECT 1 FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = $1 AND s.expires_at > now() AND u.status = 'approved' LIMIT 1`,
      [sessionId]
    );
    return rows.length > 0;
  } catch (err) {
    console.error('[proxy] session validation failed:', err);
    return false;
  }
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * กัน CSRF: request ที่เปลี่ยนแปลงข้อมูล (POST/PUT/PATCH/DELETE) ต้องมาจากหน้าเว็บของเราเองเท่านั้น
 *
 * cookie ตั้ง sameSite: 'lax' ไว้แล้ว ซึ่งกันเว็บต่างโดเมนได้ แต่ยังไม่กัน subdomain อื่นใต้
 * csmju.com (ถือเป็น "same-site") — ถ้า subdomain ใดโดนยึดหรือมีช่อง XSS ก็ยิง POST มาพร้อม
 * cookie ของผู้ใช้ได้ จึงเช็กเพิ่มว่าเป็น same-origin จริง
 *
 * 1) Sec-Fetch-Site (browser สมัยใหม่ส่งเองทุก request แก้ไม่ได้จาก JS) ต้องเป็น same-origin/none
 * 2) ถ้าไม่มี ให้เทียบ Origin กับ Host (nginx ส่ง Host เดิมต่อมา — ดู deploy/04-setup-reverse-proxy.sh)
 * 3) ไม่มีทั้งคู่ = ไม่ใช่ browser (curl/script) ซึ่งไม่มี cookie ของเหยื่อติดมาอยู่แล้ว → อนุญาต
 */
function isCrossOriginMutation(req: NextRequest): boolean {
  if (SAFE_METHODS.has(req.method)) return false;

  const fetchSite = req.headers.get('sec-fetch-site');
  if (fetchSite) return fetchSite !== 'same-origin' && fetchSite !== 'none';

  const origin = req.headers.get('origin');
  if (!origin) return false;
  if (origin === 'null') return true;
  try {
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? req.nextUrl.host;
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /api/public/* เปิดให้เว็บภายนอกเรียกแบบ GET ด้วย API key (ไม่ใช้ cookie) จึงไม่ต้องเช็ก
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/public') && isCrossOriginMutation(req)) {
    return NextResponse.json({ error: 'คำขอถูกปฏิเสธ (cross-origin)' }, { status: 403 });
  }

  // ข้ามไฟล์ static และ Next.js internal
  // และ /api/public/* ซึ่งเปิดให้เว็บภายนอกเรียกได้ (ป้องกันด้วย API Key แทน session)
  //
  // ห้ามยกเว้น /api/nas อีก — เดิมยกเว้นไว้ทำให้ใครก็ได้บนอินเทอร์เน็ตดึงรายชื่อ/รหัสนักศึกษา
  // และรูปถ่ายนักศึกษาจาก NAS ได้โดยไม่ต้องล็อกอิน (<img> ในหน้าเว็บส่ง cookie ไปเองอยู่แล้ว)
  //
  // เงื่อนไข "มีจุดใน path = ไฟล์ static" ใช้เฉพาะ path ที่ไม่ใช่ /api/ เท่านั้น — เดิมใช้กับทุก path
  // ทำให้ dynamic API route ข้าม auth ได้แค่เติมจุด เช่น GET /api/alumni/5. (Number("5.") === 5)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/lookup') ||
    pathname.startsWith('/api/public') ||
    pathname === '/favicon.ico' ||
    (!pathname.startsWith('/api/') && pathname.includes('.'))
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
