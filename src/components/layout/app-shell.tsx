'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  MessageCircle,
  Sparkles,
  BookOpen,
  PartyPopper,
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  USER_POINTS_UPDATED_EVENT,
  NOTIFICATION_ADDED_EVENT,
  notifyPointsUpdated,
  notifyNewNotification,
  type AppNotification,
} from '@/lib/events';

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n_bday_1',
    type: 'birthday',
    title: 'สุขสันต์วันเกิด! 🎂',
    description: 'พี่ณัฐพล ชัยชนะ (รุ่น 38) ส่งคำอวยพรวันเกิดให้คุณ 🎉 (+1 แต้ม)',
    time: '5 นาทีที่แล้ว',
    unread: true,
  },
  {
    id: 'n_poll_1',
    type: 'poll',
    title: 'มีโพลใหม่ให้โหวต 📊',
    description: 'ศิษย์เก่าดีเด่นประจำปี 2569 (+5 แต้ม)',
    time: '15 นาทีที่แล้ว',
    unread: true,
  },
  {
    id: 'n_verify_1',
    type: 'verify',
    title: 'ยืนยันตัวตนสำเร็จ ✨',
    description: 'Admin อนุมัติบัญชีศิษย์เก่าแล้ว',
    time: '1 ชั่วโมงที่แล้ว',
    unread: false,
  },
  {
    id: 'n_comment_1',
    type: 'comment',
    title: 'ความคิดเห็นใหม่ 💬',
    description: 'สมพงษ์ ตอบกลับโพสต์ของคุณ',
    time: 'เมื่อวานนี้',
    unread: false,
  },
];

const MAIN_NAV = [
  { href: '/feed', label: 'วอลล์/ฟีด', icon: Sparkles },
  { href: '/hall-of-fame', label: 'ศิษย์เก่าดีเด่น', icon: Star },
  { href: '/map', label: 'แผนที่ศิษย์เก่า', icon: MapPin },
  { href: '/gallery', label: 'คลังภาพเก่า', icon: ImageIcon },
  { href: '/search', label: 'หนังสือรุ่น', icon: BookOpen },
];

const ACCOUNT_NAV = [
  { href: '/profile', label: 'โปรไฟล์', icon: User },
  { href: '/admin', label: 'จัดการระบบ', icon: Settings },
];

const CURRENT_USER = { name: 'สมชาย ใจดี', generation: 'รุ่น 43', points: 16, level: 2, is_available_for_mentorship: true };

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
              } ${collapsed ? 'justify-center px-0' : ''}`}
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
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(CURRENT_USER);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  const notifPopoverRef = useRef<HTMLDivElement>(null);
  const notifBtnMobileRef = useRef<HTMLDivElement>(null);
  const notifBtnDesktopRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const unreadNotifCount = notifications.filter((n) => n.unread).length;

  const fetchUserProfile = useCallback(() => {
    fetch('/api/user/profile')
      .then((res) => res.json())
      .then((u) => {
        if (u && !u.error) {
          const points = u.totalPoints ?? u.total_points ?? 16;
          const level = Math.floor(points / 20) + 1;
          setCurrentUser({
            id: u.id,
            name: u.name || 'สมชาย ใจดี',
            generation: u.generation || 'รุ่น 43',
            points: points,
            level: level,
            avatar_url: u.avatarUrl || u.avatar_url,
            role: u.role || 'alumni',
            is_available_for_mentorship: Boolean(u.isAvailableForMentorship ?? u.is_available_for_mentorship),
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Fetch logged in user profile data from DB on mount
    fetchUserProfile();

    // Listen to global points updated events (optimistic + fresh sync)
    function handlePointsUpdated(e: Event) {
      const customEvent = e as CustomEvent<{ pointsAdded?: number; totalPoints?: number }>;
      const added = customEvent.detail?.pointsAdded ?? 1;

      setCurrentUser((prev: any) => {
        const newPoints = (prev.points ?? 0) + added;
        const newLevel = Math.floor(newPoints / 20) + 1;
        return {
          ...prev,
          points: newPoints,
          level: newLevel,
        };
      });

      // Also sync fresh from DB
      fetchUserProfile();
    }

    // Listen to new notification events (e.g. Birthday wish)
    function handleNewNotification(e: Event) {
      const customEvent = e as CustomEvent<AppNotification>;
      if (customEvent.detail) {
        setNotifications((prev) => [customEvent.detail, ...prev.filter((n) => n.id !== customEvent.detail.id)]);
      }
    }

    window.addEventListener(USER_POINTS_UPDATED_EVENT, handlePointsUpdated);
    window.addEventListener(NOTIFICATION_ADDED_EVENT, handleNewNotification);
    return () => {
      window.removeEventListener(USER_POINTS_UPDATED_EVENT, handlePointsUpdated);
      window.removeEventListener(NOTIFICATION_ADDED_EVENT, handleNewNotification);
    };
  }, [fetchUserProfile]);

  const [thankedNotifIds, setThankedNotifIds] = useState<Record<string, boolean>>({});

  function handleSendThankYou(notifId: string, _description?: string) {
    setThankedNotifIds((prev) => ({ ...prev, [notifId]: true }));
    handleMarkAsRead(notifId);

    // Reward points for gratitude
    notifyPointsUpdated(1);
    fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pointsAdded: 1, userId: currentUser.id }),
    }).catch(() => {});

    // Add confirmation notification
    notifyNewNotification({
      type: 'general',
      title: 'ส่งคำขอบคุณสำเร็จ! 💌',
      description: 'ส่งคำขอบคุณสำหรับคำอวยพรวันเกิดเรียบร้อยแล้ว (+1 แต้ม)',
    });
  }

  function handleMarkAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  function handleMarkAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isInsideNotif =
        (notifPopoverRef.current && notifPopoverRef.current.contains(target)) ||
        (notifBtnMobileRef.current && notifBtnMobileRef.current.contains(target)) ||
        (notifBtnDesktopRef.current && notifBtnDesktopRef.current.contains(target));

      if (!isInsideNotif) {
        setNotifOpen(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(target)) {
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

      {/* ─── Mobile Sticky Top Bar (Hidden on desktop) ─── */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 bg-card/90 backdrop-blur-xl border-b border-border/70 lg:hidden shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-primary text-white shadow-blue-glow">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-black text-gradient-primary">AlumniConnect</span>
          </div>
        </div>

        <div className="flex items-center gap-2" ref={notifBtnMobileRef}>
          {/* Notification Button (Mobile embedded) */}
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className={`relative flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-card text-muted-foreground transition-all active:scale-95 ${
              notifOpen ? 'bg-card text-primary ring-2 ring-primary/20' : ''
            }`}
            title={`การแจ้งเตือน ${unreadNotifCount > 0 ? `(${unreadNotifCount} ใหม่)` : ''}`}
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadNotifCount > 0 && (
              <span className="gradient-primary absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white shadow-xs animate-pulse">
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* User points badge in mobile header */}
          <Link
            href="/profile"
            className="flex items-center gap-1.5 rounded-full bg-primary-light/80 border border-primary/20 px-2.5 py-1 text-xs font-bold text-primary active:scale-95"
          >
            <span>✨ {currentUser.points}p</span>
          </Link>
        </div>
      </header>

      {/* Desktop Top-Right Floating Notification Button (Desktop only) */}
      <div className="hidden lg:block fixed top-4 right-6 z-40" ref={notifBtnDesktopRef}>
        <button
          onClick={() => {
            setNotifOpen((v) => !v);
            setAvatarOpen(false);
          }}
          className={`relative flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-card/90 backdrop-blur-xl shadow-hero text-muted-foreground transition-all hover:bg-card hover:text-primary hover:scale-105 active:scale-95 ${
            notifOpen ? 'bg-card text-primary ring-2 ring-primary/20' : ''
          }`}
          title={`การแจ้งเตือน ${unreadNotifCount > 0 ? `(${unreadNotifCount} ใหม่)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadNotifCount > 0 && (
            <span className="gradient-primary absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-xs animate-pulse">
              {unreadNotifCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification Dropdown Popover */}
      {notifOpen && (
        <div
          ref={notifPopoverRef}
          onClick={(e) => e.stopPropagation()}
          className="animate-popover-down fixed right-4 sm:right-6 top-14 sm:top-16 z-50 w-80 sm:w-96 overflow-hidden rounded-2xl border border-border bg-card shadow-hero"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-card">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">การแจ้งเตือน</span>
              {unreadNotifCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  {unreadNotifCount} ใหม่
                </span>
              )}
            </div>
            {unreadNotifCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                อ่านทั้งหมด
              </button>
            )}
          </div>

          <div className="max-h-[340px] overflow-y-auto divide-y divide-border/60 text-xs">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p>ยังไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              notifications.map((item) => {
                const isBirthday = item.type === 'birthday';
                const isPoll = item.type === 'poll';
                const isVerify = item.type === 'verify';

                return (
                  <div
                    key={item.id}
                    onClick={() => handleMarkAsRead(item.id)}
                    className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer ${
                      item.unread
                        ? isBirthday
                          ? 'bg-pink-50/70 hover:bg-pink-100/60'
                          : 'bg-primary-light/40 hover:bg-primary-light/70'
                        : 'hover:bg-muted/40'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl mt-0.5 shadow-2xs ${
                        isBirthday
                          ? 'bg-pink-100 text-pink-600'
                          : isPoll
                          ? 'bg-purple-100 text-purple-600'
                          : isVerify
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isBirthday ? (
                        <PartyPopper className="h-4 w-4" />
                      ) : isPoll ? (
                        <Sparkles className="h-4 w-4" />
                      ) : isVerify ? (
                        <CheckCheck className="h-4 w-4" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs ${item.unread ? 'font-bold text-foreground' : 'font-medium text-slate-700'}`}>
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
                      
                      {/* Quick Thank-You Button for Birthday Wishes */}
                      {isBirthday && (
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendThankYou(item.id, item.description);
                            }}
                            disabled={Boolean(thankedNotifIds[item.id])}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all ${
                              thankedNotifIds[item.id]
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-2xs'
                                : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-2xs hover:opacity-90 active:scale-95 cursor-pointer'
                            }`}
                          >
                            <span>{thankedNotifIds[item.id] ? '🙏 ส่งคำขอบคุณแล้ว ✨' : '🙏 ส่งคำขอบคุณ (+1 แต้ม)'}</span>
                          </button>
                        </div>
                      )}

                      <span className="text-[11px] text-muted-foreground/80 mt-1 inline-block font-medium">
                        {item.time}
                      </span>
                    </div>
                    {item.unread && (
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full mt-1.5 ${
                          isBirthday ? 'bg-pink-500' : 'bg-primary'
                        }`}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-border bg-slate-50/50 p-2.5 text-center">
            <button
              onClick={() => setNotifOpen(false)}
              className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Floating Glassmorphism Sidebar */}
      <aside
        className={`fixed top-3 bottom-3 left-3 z-40 flex flex-col rounded-3xl border border-border/80 bg-card/85 backdrop-blur-xl shadow-hero transition-all duration-300 ${sidebarWidth} ${
          collapsed ? 'px-2 py-4' : 'p-4'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className={`mb-6 flex items-center justify-between ${collapsed ? 'px-0 justify-center' : 'px-1'}`}>
          <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
            <div className="flex h-10 w-10 shrink-0 aspect-square items-center justify-center rounded-2xl gradient-primary text-white shadow-blue-glow">
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
                  {currentUser.avatar_url ? (
                    <img
                      src={currentUser.avatar_url}
                      alt={currentUser.name}
                      className="h-10 w-10 shrink-0 aspect-square rounded-full object-cover ring-2 ring-white/40"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 aspect-square items-center justify-center rounded-full bg-white/20 font-bold text-white text-xs backdrop-blur-xs">
                      {currentUser.name?.substring(0, 2) || 'CS'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{currentUser.name}</p>
                    <p className="text-xs text-white/80">{currentUser.generation}</p>
                    {currentUser.is_available_for_mentorship && (
                      <span className="inline-block mt-1 rounded-md bg-emerald-400/30 px-2 py-0.5 text-[10px] sm:text-xs font-extrabold text-emerald-100 border border-emerald-300/40">
                        💬 ยินดีให้คำแนะนำ
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-xl bg-white/15 px-3 py-1.5 text-xs backdrop-blur-xs">
                  <span className="font-medium">แต้มสะสม</span>
                  <span className="font-bold">{currentUser.points} แต้ม (Lv.{currentUser.level})</span>
                </div>
              </div>

              <div className="p-1.5 divide-y divide-border/50 text-xs">
                <div className="py-1 space-y-1">
                  <div className="flex items-center justify-between rounded-xl px-3 py-2 bg-emerald-50 border border-emerald-200/80 text-emerald-950">
                    <span className="flex items-center gap-2 text-xs font-bold">
                      <MessageCircle className="h-4 w-4 text-emerald-600" />
                      ยินดีให้คำแนะนำ
                    </span>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const next = !currentUser.is_available_for_mentorship;
                        setCurrentUser((prev: any) => ({ ...prev, is_available_for_mentorship: next }));
                        await fetch('/api/user/profile', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ isAvailableForMentorship: next, userId: currentUser.id }),
                        }).catch(() => {});
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        currentUser.is_available_for_mentorship ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          currentUser.is_available_for_mentorship ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-foreground transition-colors hover:bg-primary-light hover:text-primary font-medium"
                  >
                    <User className="h-4 w-4 text-primary" />
                    โปรไฟล์ของฉัน
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-foreground transition-colors hover:bg-primary-light hover:text-primary font-medium"
                  >
                    <Settings className="h-4 w-4 text-slate-500" />
                    การตั้งค่าความเป็นส่วนตัว
                  </Link>
                  <Link
                    href="/hall-of-fame"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-foreground transition-colors hover:bg-primary-light hover:text-primary font-medium"
                  >
                    <Award className="h-4 w-4 text-amber-500" />
                    แต้ม & รางวัลศิษย์เก่า
                  </Link>
                  {currentUser.role === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setAvatarOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-foreground transition-colors hover:bg-primary-light hover:text-primary font-medium"
                    >
                      <Shield className="h-4 w-4 text-indigo-500" />
                      จัดการระบบ Admin
                    </Link>
                  )}
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => {
                      setAvatarOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-rose-600 transition-colors hover:bg-rose-50 font-medium cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    ออกจากระบบ
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Integrated User Card with Smooth Slide-Up Inline Expansion */}
          <div className={`gradient-primary overflow-hidden rounded-2xl text-white shadow-blue-glow transition-all duration-300 ${collapsed ? 'p-2' : 'p-3'}`}>
            <button
              onClick={() => {
                setAvatarOpen((v) => !v);
                setNotifOpen(false);
              }}
              className="w-full text-left flex items-center gap-2.5 cursor-pointer justify-center"
              title={collapsed ? `${currentUser.name} (${currentUser.points} แต้ม)` : undefined}
            >
              {collapsed ? (
                <div className="flex flex-col items-center gap-1 mx-auto shrink-0">
                  {currentUser.avatar_url ? (
                    <img
                      src={currentUser.avatar_url}
                      alt={currentUser.name}
                      className="h-9 w-9 shrink-0 aspect-square rounded-full object-cover ring-1 ring-white/40"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 aspect-square items-center justify-center rounded-full bg-white/25 text-xs font-bold shadow-xs">
                      {currentUser.name?.substring(0, 2) || 'CS'}
                    </div>
                  )}
                  <p className="text-[10px] font-extrabold shrink-0 text-center leading-none mt-0.5">{currentUser.points}p</p>
                </div>
              ) : (
                <>
                  <div className="relative shrink-0">
                    {currentUser.avatar_url ? (
                      <img
                        src={currentUser.avatar_url}
                        alt={currentUser.name}
                        className="h-9 w-9 shrink-0 aspect-square rounded-full object-cover ring-2 ring-white/40"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 aspect-square items-center justify-center rounded-full bg-white/20 text-xs font-bold shadow-xs ring-2 ring-white/40 backdrop-blur-xs">
                        {currentUser.name?.substring(0, 2) || 'CS'}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs sm:text-sm font-bold truncate">{currentUser.name}</p>
                      <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[10px] sm:text-xs font-bold shrink-0">
                        Lv.{currentUser.level}
                      </span>
                    </div>
                    <p className="text-xs text-white/80 truncate">{currentUser.generation} • {currentUser.points} แต้ม</p>
                    {currentUser.is_available_for_mentorship && (
                      <span className="inline-block mt-0.5 rounded-md bg-emerald-400/30 px-1.5 py-0.5 text-[10px] sm:text-xs font-extrabold text-emerald-100 border border-emerald-300/40">
                        💬 ยินดีให้คำแนะนำ
                      </span>
                    )}
                  </div>
                  <ChevronRight className={`h-4 w-4 text-white/80 shrink-0 transition-transform duration-300 ${avatarOpen ? '-rotate-90' : ''}`} />
                </>
              )}
            </button>

            {/* Inline Slide-Up Options inside the SAME Card */}
            {avatarOpen && !collapsed && (
              <div className="mt-3 pt-3 border-t border-white/20 text-xs space-y-1.5 animate-popover-down">
                {/* Quick Toggle for Mentorship */}
                <div className="flex items-center justify-between rounded-xl px-2.5 py-2 bg-white/15 backdrop-blur-xs text-white my-1">
                  <span className="flex items-center gap-2 text-xs font-bold">
                    <MessageCircle className="h-4 w-4 text-emerald-300" />
                    ยินดีให้คำแนะนำรุ่นน้อง
                  </span>
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const next = !currentUser.is_available_for_mentorship;
                      setCurrentUser((prev: any) => ({ ...prev, is_available_for_mentorship: next }));
                      await fetch('/api/user/profile', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isAvailableForMentorship: next, userId: currentUser.id }),
                      }).catch(() => {});
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      currentUser.is_available_for_mentorship ? 'bg-emerald-400' : 'bg-white/30'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        currentUser.is_available_for_mentorship ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <Link
                  href="/profile"
                  onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-white hover:bg-white/20 transition-colors font-medium"
                >
                  <User className="h-4 w-4 text-white" />
                  โปรไฟล์ของฉัน
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-white hover:bg-white/20 transition-colors font-medium"
                >
                  <Settings className="h-4 w-4 text-white/80" />
                  การตั้งค่าความเป็นส่วนตัว
                </Link>
                <Link
                  href="/hall-of-fame"
                  onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-white hover:bg-white/20 transition-colors font-medium"
                >
                  <Award className="h-4 w-4 text-amber-300" />
                  แต้ม & รางวัลศิษย์เก่า
                </Link>
                {currentUser.role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-white hover:bg-white/20 transition-colors font-medium"
                  >
                    <Shield className="h-4 w-4 text-indigo-200" />
                    จัดการระบบ Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    setAvatarOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-rose-200 hover:bg-rose-500/30 transition-colors font-medium cursor-pointer"
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

      {/* Main Content Area */}
      <div className={`flex min-h-screen flex-col transition-[padding] duration-200 ${contentOffset}`}>
        <main className="flex-1 px-3.5 py-4 sm:px-6 lg:px-8 pb-24 lg:pb-8">{children}</main>
      </div>

      {/* ─── Modern Glassmorphic Mobile Bottom Navigation Bar (< lg) ─── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border/70 bg-card/90 backdrop-blur-xl px-1.5 py-1.5 shadow-hero lg:hidden">
        {[
          { href: '/feed', label: 'วอลล์', icon: Sparkles },
          { href: '/search', label: 'หนังสือรุ่น', icon: BookOpen },
          { href: '/hall-of-fame', label: 'ดีเด่น', icon: Star },
          { href: '/map', label: 'แผนที่', icon: MapPin },
          { href: '/gallery', label: 'ภาพเก่า', icon: ImageIcon },
          { href: '/profile', label: 'โปรไฟล์', icon: User },
        ].map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-1 px-2 transition-all active:scale-90 ${
                isActive ? 'text-primary font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-primary/10 text-primary shadow-2xs' : ''}`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}