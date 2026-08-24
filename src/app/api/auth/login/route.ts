import { authenticateUser, createSession } from '@/lib/auth';
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

    const user = await authenticateUser(identifier, password);
    if (!user) {
      return NextResponse.json(
        { error: 'รหัสนักศึกษา/อีเมล หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
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
      maxAge: 30 * 24 * 60 * 60, // 30 วัน
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
