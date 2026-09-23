import { authenticateUser, createSession, checkLoginRateLimit, recordLoginAttempt, SESSION_MAX_AGE_SECONDS } from '@/lib/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = body.identifier || body.studentId || body.email;
    const password = body.password;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'กรุณากรอกรหัสนักศึกษา/อีเมล และรหัสผ่าน' },
        { status: 400 }
      );
    }

    try {
      await checkLoginRateLimit(identifier);
    } catch (rateLimitErr: any) {
      return NextResponse.json({ error: rateLimitErr.message }, { status: 429 });
    }

    const user = await authenticateUser(identifier, password);
    if (!user) {
      await recordLoginAttempt(identifier, false);
      return NextResponse.json(
        { error: 'รหัสนักศึกษา/อีเมล หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // รหัสผ่านถูกต้องแล้ว ณ จุดนี้ — ไม่นับเป็นความพยายามเดารหัสผ่านผิดแม้บัญชีจะยัง
    // pending/rejected อยู่ก็ตาม (สถานะบัญชีเป็นคนละเรื่องกับความถูกต้องของรหัสผ่าน)
    await recordLoginAttempt(identifier, true);

    if (user.status === 'pending') {
      return NextResponse.json(
        {
          error: 'บัญชีของคุณอยู่ระหว่างรอการอนุมัติจากผู้ดูแลระบบหรือเพื่อนร่วมรุ่น',
          status: 'pending',
        },
        { status: 403 }
      );
    }

    if (user.status === 'rejected') {
      return NextResponse.json(
        {
          error: 'บัญชีนี้ไม่ผ่านการอนุมัติการเข้าใช้งานระบบ กรุณาติดต่อผู้ดูแลระบบ',
          status: 'rejected',
        },
        { status: 403 }
      );
    }

    // สร้าง session ใหม่
    const sessionId = await createSession(user.id);

    // กำหนด HTTP-only Cookie
    const cookieStore = await cookies();
    cookieStore.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        student_id: user.student_id,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' }, { status: 500 });
  }
}
