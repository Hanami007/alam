'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Home,
  Image as ImageIcon,
  Menu,
  MapPin,
  Search,
  Settings,
  Star,
  User,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';

const MAIN_NAV = [
  { href: '/', label: 'หน้าแรก', icon: Home },
  { href: '/feed', label: 'วอลล์/ฟีด', icon: Bell },
  { href: '/hall-of-fame', label: 'ศิษย์เก่าดีเด่น', icon: Star },
  { href: '/map', label: 'แผนที่ศิษย์เก่า', icon: MapPin },
  { href: '/gallery', label: 'คลังภาพเก่า', icon: ImageIcon },
];

const ACCOUNT_NAV = [
  { href: '/profile', label: 'โปรไฟล์', icon: User },
  { href: '/admin', label: 'Admin', icon: Settings },
];

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'หน้าแรก', subtitle: 'ภาพรวมของระบบศิษย์เก่า' },
  '/feed': { title: 'วอลล์ / ฟีดข่าวสาร', subtitle: 'ประกาศและกิจกรรมล่าสุด' },
  '/hall-of-fame': { title: 'ศิษย์เก่าดีเด่น', subtitle: 'ยกย่องความสำเร็จของศิษย์เก่า' },
  '/map': { title: 'แผนที่ศิษย์เก่า', subtitle: 'การกระจายตัวทั่วประเทศ' },
  '/gallery': { title: 'คลังภาพเก่า', subtitle: 'ความทรงจำแยกตามรุ่น' },
  '/profile': { title: 'โปรไฟล์', subtitle: 'บัญชีของฉัน' },
  '/admin': { title: 'Admin', subtitle: 'จัดการระบบ' },
};

const CURRENT_USER = { name: 'สมชาย ใจดี', generation: 'รุ่น 43', points: 16, level: 2 };

function NavSection({
  title,
  items,
  pathname,
  collapsed,
}: {
  title: string;
  items: typeof MAIN_NAV;
  pathname: string | null;
  collapsed: boolean;
}) {
  return (
    <div>
      {!collapsed && (
        <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{title}</p>
      )}
      <div className="mt-2 flex flex-col gap-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'gradient-primary text-white' : 'text-muted-foreground hover:bg-primary-light hover:text-primary'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              {isActive && <span className="absolute right-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full gradient-primary" />}
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  const meta = PAGE_META[pathname ?? '/'] ?? PAGE_META['/'];
  const sidebarWidth = collapsed ? 'lg:w-[72px]' : 'lg:w-[240px]';
  const contentOffset = collapsed ? 'lg:pl-[72px]' : 'lg:pl-[240px]';

  return (
    <div className="relative min-h-screen bg-background">
      {/* พื้นหลังลวดลายตกแต่ง — ทุกหน้าใช้ร่วมกันจากตรงนี้ */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="decor-blob-primary fixed right-10 top-20 h-80 w-80 opacity-40" />
        <div className="decor-blob-secondary fixed -bottom-10 left-10 h-72 w-72 opacity-30" />
        <div className="decor-dot-pattern absolute inset-0 opacity-[0.35]" />
      </div>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-border bg-card px-4 py-6 transition-transform duration-200 ${sidebarWidth} ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="mb-8 flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl gradient-primary text-white shadow-blue-glow">
              <GraduationCap className="h-5 w-5" />
            </div>
            {!collapsed && <span className="text-base font-bold text-gradient-primary">AlumniConnect</span>}
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-muted-foreground lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto">
          <NavSection title="เมนูหลัก" items={MAIN_NAV} pathname={pathname} collapsed={collapsed} />
          <NavSection title="บัญชีของฉัน" items={ACCOUNT_NAV} pathname={pathname} collapsed={collapsed} />
        </nav>

        {/* Points card */}
        <div className="gradient-primary mt-4 overflow-hidden rounded-2xl p-4 text-white">
          {collapsed ? (
            <p className="text-center text-xs font-bold">{CURRENT_USER.points}</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{CURRENT_USER.name}</p>
                <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold">Lv.{CURRENT_USER.level}</span>
              </div>
              <p className="text-xs text-white/80">{CURRENT_USER.generation}</p>
              <p className="mt-2 text-2xl font-extrabold tabular-nums">{CURRENT_USER.points} แต้ม</p>
            </>
          )}
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="mt-3 hidden items-center justify-center gap-2 rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary lg:flex"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && 'ย่อเมนู'}
        </button>
      </aside>

      {/* Main content */}
      <div className={`flex min-h-screen flex-col transition-[padding] duration-200 ${contentOffset}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="text-muted-foreground lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-[16px] font-bold text-foreground">{meta.title}</p>
              <p className="hidden text-[11px] text-muted-foreground sm:block">{meta.subtitle}</p>
            </div>
          </div>

          <label className="input-base hidden max-w-xs flex-1 items-center gap-2 px-3.5 py-2 text-sm text-muted-foreground md:flex">
            <Search className="h-4 w-4" />
            <input placeholder="ค้นหา..." className="w-full border-none bg-transparent outline-none" />
          </label>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setAvatarOpen(false);
                }}
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary-light hover:text-primary"
              >
                <Bell className="h-[18px] w-[18px]" />
                <span className="gradient-primary absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white">
                  2
                </span>
              </button>
              {notifOpen && (
                <div className="animate-fade-in absolute right-0 mt-2 w-72 divide-y divide-border rounded-2xl border border-border bg-card shadow-card-hover">
                  <div className="bg-primary-light/30 flex items-start gap-2 p-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <p className="text-xs text-foreground">มีโพลใหม่ให้โหวต ได้ +5 คะแนน</p>
                  </div>
                  <div className="flex items-start gap-2 p-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-transparent" />
                    <p className="text-xs text-muted-foreground">Admin อนุมัติบัญชีของคุณแล้ว</p>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setAvatarOpen((v) => !v);
                  setNotifOpen(false);
                }}
                className="gradient-primary flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
              >
                สช
              </button>
              {avatarOpen && (
                <div className="animate-fade-in absolute right-0 mt-2 w-48 divide-y divide-border rounded-2xl border border-border bg-card shadow-card-hover">
                  <Link href="/profile" className="block p-3 text-xs text-foreground hover:text-primary">
                    โปรไฟล์ของฉัน
                  </Link>
                  <p className="p-3 text-xs text-muted-foreground">ออกจากระบบ</p>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}