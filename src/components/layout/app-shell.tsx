'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  ChevronRight,
  GraduationCap,
  Home,
  Image as ImageIcon,
  MapPin,
  Search,
  Settings,
  Star,
  User,
} from 'lucide-react';
import type { ReactNode } from 'react';

const navItems = [
  { href: '/', label: 'หน้าแรก', icon: Home },
  { href: '/feed', label: 'วอลล์/ฟีด', icon: Bell },
  { href: '/hall-of-fame', label: 'ศิษย์เก่าดีเด่น', icon: Star },
  { href: '/map', label: 'แผนที่ศิษย์เก่า', icon: MapPin },
  { href: '/gallery', label: 'คลังภาพเก่า', icon: ImageIcon },
  { href: '/profile', label: 'โปรไฟล์', icon: User },
  { href: '/admin', label: 'Admin', icon: Settings },
];

const pageTitles: Record<string, { eyebrow: string; title: string }> = {
  '/': { eyebrow: 'ภาพรวม', title: 'หน้าแรก' },
  '/feed': { eyebrow: 'ชุมชนศิษย์เก่า', title: 'วอลล์ / ฟีดข่าวสาร' },
  '/hall-of-fame': { eyebrow: 'ยกย่องความสำเร็จ', title: 'ศิษย์เก่าดีเด่น' },
  '/map': { eyebrow: 'ทั่วประเทศ', title: 'แผนที่ศิษย์เก่า' },
  '/gallery': { eyebrow: 'ความทรงจำ', title: 'คลังภาพเก่า' },
  '/profile': { eyebrow: 'บัญชีของฉัน', title: 'โปรไฟล์' },
  '/admin': { eyebrow: 'ผู้ดูแลระบบ', title: 'Admin' },
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const page = pageTitles[pathname ?? '/'] ?? pageTitles['/'];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F2F8FF]">
      {/* พื้นหลังลวดลาย gradient blob ให้มีมิติ ไม่แบนราบ */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/3 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-[#0099FF]/25 to-[#6495ED]/10 blur-3xl" />
        <div className="absolute top-1/2 -right-32 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-[#33CCFF]/25 to-transparent blur-3xl" />
        <svg className="absolute inset-x-0 top-0 h-full w-full opacity-[0.35]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="#0099FF" fillOpacity="0.14" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div className="mx-auto flex max-w-[1440px]">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-white/60 bg-white/70 px-4 py-6 backdrop-blur-xl lg:flex">
          <div className="mb-8 flex items-center gap-2.5 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0099FF] to-[#1E90FF] text-white shadow-lg shadow-[#0099FF]/30">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-slate-900">ระบบศิษย์เก่า</p>
              <p className="text-[11px] leading-tight text-slate-400">Alumni Connect</p>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0099FF] to-[#1E90FF] text-white shadow-md shadow-[#0099FF]/25'
                      : 'text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm'
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] ${isActive ? '' : 'text-slate-400 group-hover:text-[#0099FF]'}`} />
                  {item.label}
                  {isActive && <ChevronRight className="ml-auto h-4 w-4 opacity-70" />}
                </Link>
              );
            })}
          </nav>

          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#0099FF] to-[#6495ED] p-4 text-white">
            <p className="text-xs font-semibold text-white/90">คะแนนสะสมของฉัน</p>
            <p className="mt-2 text-2xl font-bold">16 แต้ม</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/25">
              <div className="h-full w-[64%] rounded-full bg-white" />
            </div>
            <p className="mt-1.5 text-[11px] text-white/75">อีก 9 แต้มถึงเลเวลถัดไป</p>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/60 bg-white/70 px-6 py-4 backdrop-blur-xl">
            <div>
              <p className="text-xs font-medium text-[#0099FF]">{page.eyebrow}</p>
              <h1 className="text-lg font-semibold text-slate-900">{page.title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <label className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-400 md:flex">
                <Search className="h-4 w-4" />
                <input placeholder="ค้นหา..." className="w-40 border-none bg-transparent outline-none" />
              </label>
              <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#0099FF]" />
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0099FF] to-[#6495ED] text-sm font-semibold text-white shadow-md shadow-[#0099FF]/30">
                สช
              </div>
            </div>
          </header>

          <main className="flex-1 px-6 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}