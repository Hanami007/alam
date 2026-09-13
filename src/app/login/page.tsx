'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Users,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/feed';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('กรุณากรอกรหัสนักศึกษา/อีเมล และรหัสผ่าน');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || 'เข้าสู่ระบบไม่สำเร็จ');
        return;
      }

      // นำทางไปยัง callbackUrl หรือหน้า feed
      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  }

  function handleQuickFill(userIdentifier: string, userPass = '123456') {
    setIdentifier(userIdentifier);
    setPassword(userPass);
    setError(null);
  }

  return (
    <div className="rounded-[32px] border border-white/10 bg-white/95 backdrop-blur-xl p-7 sm:p-8 shadow-2xl space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-bold text-slate-900">เข้าสู่ระบบ</h2>
        <p className="text-xs text-slate-500">กรอกรหัสนักศึกษา หรือ อีเมล เพื่อเข้าใช้งานระบบ</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 font-medium animate-shake">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Student ID / Email Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-indigo-600" /> รหัสนักศึกษา / อีเมล
          </label>
          <div className="relative">
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="เช่น 60010001 หรือ admin@uni.ac.th"
              disabled={loading}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-indigo-600" /> รหัสผ่าน
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านของคุณ"
              disabled={loading}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>กำลังเข้าสู่ระบบ...</span>
            </div>
          ) : (
            <>
              <span>เข้าสู่ระบบ</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Register Link */}
      <div className="text-center pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          ยังไม่มีบัญชีสมาชิกใช่หรือไม่?{' '}
          <Link
            href="/register"
            className="font-bold text-indigo-600 hover:text-indigo-800 underline transition-colors"
          >
            สมัครสมาชิกใหม่ที่นี่
          </Link>
        </p>
      </div>

      {/* Quick Login Helper Box */}
      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2.5">
        <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" /> บัญชีทดสอบด่วน (รหัสผ่าน: 123456)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickFill('admin@uni.ac.th')}
            className="flex items-center gap-2 rounded-xl bg-white p-2 text-left border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all cursor-pointer"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">แอดมิน (Admin)</p>
              <p className="text-xs text-slate-500 truncate">admin@uni.ac.th</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('60010001')}
            className="flex items-center gap-2 rounded-xl bg-white p-2 text-left border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all cursor-pointer"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">สมชาย ใจดี (ศิษย์เก่า)</p>
              <p className="text-xs text-slate-500 truncate">รหัส 60010001</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-4 sm:p-6 overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full max-w-4xl bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/30 border border-white/20 mb-2">
            <GraduationCap className="h-9 w-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            CS MJU CONNECT
          </h1>
          <p className="text-sm text-slate-400">
            ระบบเครือข่ายศิษย์เก่าและนักศึกษา วิทยาการคอมพิวเตอร์
          </p>
        </div>

        {/* Login Card with Suspense */}
        <Suspense
          fallback={
            <div className="rounded-[32px] border border-white/10 bg-white/95 backdrop-blur-xl p-8 shadow-2xl text-center space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent mx-auto" />
              <p className="text-sm text-slate-500">กำลังโหลด...</p>
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        {/* Footer Note */}
        <p className="mt-6 text-center text-xs text-slate-500">
          ภาควิชาวิทยาการคอมพิวเตอร์ มหาวิทยาลัยแม่โจ้ © 2026
        </p>
      </div>
    </div>
  );
}
