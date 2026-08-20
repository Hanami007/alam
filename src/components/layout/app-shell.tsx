'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Image as ImageIcon,
  Menu,
  MapPin,
  Search,
  Settings,
  Star,
  User,
  X,
  LogOut,
  Shield,
  Award,
  CheckCheck,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

const MAIN_NAV = [
  { href: '/feed', label: 'วอลล์/ฟีด', icon: Sparkles },
  { href: '/hall-of-fame', label: 'ศิษย์เก่าดีเด่น', icon: Star },
  { href: '/map', label: 'แผนที่ศิษย์เก่า', icon: MapPin },
  { href: '/gallery', label: 'คลังภาพเก่า', icon: ImageIcon },
  { href: '/search', label: 'ค้นหาศิษย์เก่า', icon: Search },
];

const ACCOUNT_NAV = [
  { href: '/profile', label: 'โปรไฟล์', icon: User },
  { href: '/admin', label: 'จัดการระบบ', icon: Settings },
];

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
  const activeIndex = items.findIndex((item) => item.href === pathname);

  return (
    <div>
      {!collapsed && (
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{title}</p>
      )}
      <div className="relative flex flex-col gap-1">
        {/* Active Tab Sliding Background Pill Animation */}
        {activeIndex !== -1 && (
          <div
            className="absolute left-0 right-0 h-10 rounded-xl gradient-primary shadow-blue-glow transition-transform duration-300 cubic-bezier(0.34,1.56,0.64,1) -z-0 pointer-events-none"
            style={{
              transform: `translateY(${activeIndex * 44}px)`,
            }}
          />
        )}

        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`group relative z-10 flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-white'
                  : 'text-muted-foreground hover:bg-primary-light/60 hover:text-primary'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon className={`h-[18px] w-[18px] shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              {!collapsed && <span>{item.label}</span>}
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

  const notifRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sidebarWidth = collapsed ? 'lg:w-[72px]' : 'lg:w-[250px]';
  const contentOffset = collapsed ? 'lg:pl-[88px]' : 'lg:pl-[266px]';

  return (
    <div className="relative min-h-screen bg-background">
      {/* Decorative background gradients */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="decor-blob-primary fixed right-10 top-20 h-80 w-80 opacity-40" />
        <div className="decor-blob-secondary fixed -bottom-10 left-10 h-72 w-72 opacity-30" />
        <div className="decor-dot-pattern absolute inset-0 opacity-[0.35]" />
      </div>

      {/* Top-Right Floating Glass Notification Button */}
      <div className="fixed top-4 right-4 sm:right-6 z-40" ref={notifRef}>
        <button
          onClick={() => {
            setNotifOpen((v) => !v);
            setAvatarOpen(false);
          }}
          className={`relative flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-card/90 backdrop-blur-xl shadow-hero text-muted-foreground transition-all hover:bg-card hover:text-primary hover:scale-105 active:scale-95 ${
            notifOpen ? 'bg-card text-primary ring-2 ring-primary/20' : ''
          }`}
          title="การแจ้งเตือน (2 ใหม่)"
        >
          <Bell className="h-5 w-5" />
          <span className="gradient-primary absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-xs">
            2
          </span>
        </button>

        {/* Notification Dropdown Popover */}
        {notifOpen && (
          <div className="animate-popover-down fixed sm:absolute right-4 sm:right-0 top-16 sm:top-14 z-50 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-hero">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-card">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">การแจ้งเตือน</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">2 ใหม่</span>
              </div>
              <button className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                <CheckCheck className="h-3.5 w-3.5" />
                อ่านทั้งหมด
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto divide-y divide-border/60 text-xs">
              <div className="flex items-start gap-3 p-3.5 bg-primary-light/40 transition-colors hover:bg-primary-light/70 cursor-pointer">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary mt-0.5">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">มีโพลใหม่ให้โหวต</p>
                  <p className="text-xs text-muted-foreground truncate">ศิษย์เก่าดีเด่นประจำปี 2569 (+5 แต้ม)</p>
                  <span className="text-xs text-primary font-medium mt-1 inline-block">10 นาทีที่แล้ว</span>
                </div>
                <span className="h-2 w-2 shrink-0 rounded-full bg-primary mt-1.5" />
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-primary-light/40 transition-colors hover:bg-primary-light/70 cursor-pointer">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 mt-0.5">
                  <CheckCheck className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">ยืนยันตัวตนสำเร็จ</p>
                  <p className="text-xs text-muted-foreground truncate">Admin อนุมัติบัญชีศิษย์เก่าแล้ว</p>
                  <span className="text-xs text-muted-foreground mt-1 inline-block">1 ชั่วโมงที่แล้ว</span>
                </div>
                <span className="h-2 w-2 shrink-0 rounded-full bg-primary mt-1.5" />
              </div>

              <div className="flex items-start gap-3 p-3.5 transition-colors hover:bg-muted/40 cursor-pointer">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 mt-0.5">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">ความคิดเห็นใหม่</p>
                  <p className="text-xs text-muted-foreground truncate">สมพงษ์ ตอบกลับโพสต์ของคุณ</p>
                  <span className="text-xs text-muted-foreground mt-1 inline-block">เมื่อวานนี้</span>
                </div>
              </div>
            </div>

            <div className="border-t border-border bg-slate-50/50 p-2.5 text-center">
              <button className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                ดูการแจ้งเตือนทั้งหมด
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Mobile Hamburger Menu Toggle Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-30 flex h-11 w-11 items-center justify-center rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-md text-foreground transition-all hover:bg-card hover:scale-105 active:scale-95 lg:hidden"
        title="เปิดเมนู"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Floating Glassmorphism Sidebar */}
      <aside
        className={`fixed top-3 bottom-3 left-3 z-40 flex flex-col rounded-3xl border border-border/80 bg-card/85 p-4 backdrop-blur-xl shadow-hero transition-all duration-300 ${sidebarWidth} ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="mb-6 flex items-center justify-between px-1">
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

        {/* Sidebar Nav Sections */}
        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto pr-0.5">
          <NavSection title="เมนูหลัก" items={MAIN_NAV} pathname={pathname} collapsed={collapsed} />
          <NavSection title="บัญชีของฉัน" items={ACCOUNT_NAV} pathname={pathname} collapsed={collapsed} />
        </nav>

        {/* User Card with Inline Accordion Expansion */}
        <div className="relative mt-auto pt-3" ref={avatarRef}>
          {/* Collapsed view floating popup */}
          {avatarOpen && collapsed && (
            <div className="animate-popover-down fixed left-[84px] bottom-4 z-50 overflow-hidden rounded-2xl border border-border bg-card shadow-hero w-64">
              <div className="gradient-primary p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 font-bold text-white text-xs backdrop-blur-xs">
                    สช
                  </div>
                  <div>
                    <p className="text-sm font-bold">{CURRENT_USER.name}</p>
                    <p className="text-xs text-white/80">{CURRENT_USER.generation}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-xl bg-white/15 px-3 py-1.5 text-xs backdrop-blur-xs">
                  <span className="font-medium">แต้มสะสม</span>
                  <span className="font-bold">{CURRENT_USER.points} แต้ม (Lv.{CURRENT_USER.level})</span>
                </div>
              </div>

              <div className="p-1.5 divide-y divide-border/50 text-xs">
                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-foreground transition-colors hover:bg-primary-light hover:text-primary font-medium"
                  >
                    <User className="h-4 w-4 text-primary" />
                    โปรไฟล์ของฉัน
                  </Link>
                  <Link
                    href="/hall-of-fame"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-foreground transition-colors hover:bg-primary-light hover:text-primary font-medium"
                  >
                    <Award className="h-4 w-4 text-amber-500" />
                    แต้ม & รางวัลศิษย์เก่า
                  </Link>
                  <Link
                    href="/admin"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-foreground transition-colors hover:bg-primary-light hover:text-primary font-medium"
                  >
                    <Shield className="h-4 w-4 text-indigo-500" />
                    จัดการระบบ Admin
                  </Link>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => setAvatarOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-rose-600 transition-colors hover:bg-rose-50 font-medium"
                  >
                    <LogOut className="h-4 w-4" />
                    ออกจากระบบ
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Integrated User Card with Smooth Slide-Up Inline Expansion */}
          <div className="gradient-primary overflow-hidden rounded-2xl p-3 text-white shadow-blue-glow transition-all duration-300">
            <button
              onClick={() => {
                setAvatarOpen((v) => !v);
                setNotifOpen(false);
              }}
              className="w-full text-left flex items-center gap-2.5 cursor-pointer"
              title={collapsed ? `${CURRENT_USER.name} (${CURRENT_USER.points} แต้ม)` : undefined}
            >
              {collapsed ? (
                <div className="flex flex-col items-center gap-1 mx-auto">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/25 text-xs font-bold shadow-xs">
                    สช
                  </div>
                  <p className="text-[10px] font-extrabold">{CURRENT_USER.points}p</p>
                </div>
              ) : (
                <>
                  <div className="relative shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xs font-bold shadow-xs ring-2 ring-white/40 backdrop-blur-xs">
                      สช
                    </div>
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold truncate">{CURRENT_USER.name}</p>
                      <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[10px] font-bold shrink-0">
                        Lv.{CURRENT_USER.level}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/80">{CURRENT_USER.generation} • {CURRENT_USER.points} แต้ม</p>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-white/80 shrink-0 transition-transform duration-300 ${avatarOpen ? '-rotate-90' : ''}`} />
                </>
              )}
            </button>

            {/* Inline Slide-Up Options inside the SAME Card */}
            {avatarOpen && !collapsed && (
              <div className="mt-3 pt-3 border-t border-white/20 text-xs space-y-1 animate-popover-down">
                <Link
                  href="/profile"
                  onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-white hover:bg-white/20 transition-colors font-medium"
                >
                  <User className="h-4 w-4 text-white" />
                  โปรไฟล์ของฉัน
                </Link>
                <Link
                  href="/hall-of-fame"
                  onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-white hover:bg-white/20 transition-colors font-medium"
                >
                  <Award className="h-4 w-4 text-amber-300" />
                  แต้ม & รางวัลศิษย์เก่า
                </Link>
                <Link
                  href="/admin"
                  onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-white hover:bg-white/20 transition-colors font-medium"
                >
                  <Shield className="h-4 w-4 text-indigo-200" />
                  จัดการระบบ Admin
                </Link>
                <button
                  onClick={() => setAvatarOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-rose-200 hover:bg-rose-500/30 transition-colors font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  ออกจากระบบ
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Floating Side-Badge Toggle Button (Desktop only) */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
          className="absolute -right-3.5 top-6 hidden h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-card transition-all duration-200 hover:scale-115 hover:border-primary hover:text-primary hover:shadow-blue-glow lg:flex z-50"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* Main Content Area (No Topbar Header) */}
      <div className={`flex min-h-screen flex-col transition-[padding] duration-200 ${contentOffset}`}>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}