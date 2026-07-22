import Link from 'next/link';
import { ArrowRight, CalendarDays, ImageIcon, MapPin, Sparkles, TrendingUp, Users } from 'lucide-react';
import { getAlumniProfiles, getDashboardStats, getGalleryItems } from '@/lib/db';

const AVATAR_SAMPLE = [
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=100&q=60',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&q=60',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&q=60',
];

export async function DashboardGrid() {
  const [stats, profiles, gallery] = await Promise.all([
    getDashboardStats(),
    getAlumniProfiles(),
    getGalleryItems(),
  ]);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="grid gap-4 lg:grid-cols-[1.6fr_0.9fr]">
        <div className="relative overflow-hidden rounded-[28px] border border-white bg-white p-8 shadow-[0_20px_60px_-25px_rgba(0,153,255,0.35)]">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-[#EAF6FF] to-[#DCEEFF]" />
          <div className="pointer-events-none absolute -right-6 top-10 h-28 w-28 rounded-3xl bg-gradient-to-br from-[#0099FF] to-[#1E90FF] opacity-90" />
          <div className="pointer-events-none absolute right-16 top-28 h-10 w-10 rounded-2xl bg-[#33CCFF]" />

          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF6FF] px-3 py-1 text-xs font-semibold text-[#0099FF]">
              <Sparkles className="h-3.5 w-3.5" /> ข่าวสารล่าสุด
            </span>
            <h1 className="mt-4 max-w-md text-4xl font-bold leading-tight tracking-tight text-slate-900">
              ระบบศิษย์เก่า ที่เชื่อมทุกรุ่นไว้ในที่เดียว
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-500">
              วอลล์ประกาศข่าว · ศิษย์เก่าดีเด่น · แผนที่กระจายตัวศิษย์เก่า · โปรไฟล์ส่วนตัว · คลังภาพเก่าตามรุ่น
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/feed"
                className="rounded-xl bg-gradient-to-r from-[#0099FF] to-[#1E90FF] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0099FF]/30 transition hover:shadow-xl"
              >
                เปิดวอลล์ข่าวสาร
              </Link>
              <Link
                href="/hall-of-fame"
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-[#0099FF] hover:text-[#0099FF]"
              >
                ดูศิษย์เก่าดีเด่น
              </Link>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0099FF] via-[#1E90FF] to-[#6495ED] p-7 text-white shadow-[0_20px_60px_-20px_rgba(0,153,255,0.55)]">
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-bl-[40px] bg-white/10" />
          <p className="text-sm font-medium text-white/80">กิจกรรมที่กำลังจะมาถึง</p>
          <h2 className="mt-2 text-2xl font-bold">งานคืนสู่เหย้าและมอบรางวัล</h2>
          <div className="mt-6 space-y-3 text-sm text-white/90">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <CalendarDays className="h-4 w-4" />
              </div>
              20 ธ.ค. 2569 · 18:30 น.
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <MapPin className="h-4 w-4" />
              </div>
              Grand Hall, กรุงเทพฯ
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-white/20 pt-5">
            <div className="flex -space-x-3">
              {AVATAR_SAMPLE.map((src) => (
                <img key={src} src={src} className="h-8 w-8 rounded-full border-2 border-white object-cover" alt="" />
              ))}
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white/25 text-[10px] font-semibold">
                +317
              </div>
            </div>
            <p className="text-xs text-white/85">ยืนยันเข้าร่วมแล้ว 320 คน</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'จำนวนศิษย์เก่า', value: stats.totalAlumni, icon: Users, pct: 82 },
            { label: 'จำนวนรุ่น', value: stats.totalGenerations, icon: CalendarDays, pct: 55 },
            { label: 'ผู้เข้าชิงศิษย์เก่าดีเด่น', value: stats.outstandingAlumni, icon: TrendingUp, pct: 40 },
          ].map((item) => (
            <div
              key={item.label}
              className="group rounded-2xl border border-white bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF6FF] text-[#0099FF] transition group-hover:bg-[#0099FF] group-hover:text-white">
                <item.icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm text-slate-400">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{item.value}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EAF6FF]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#0099FF] to-[#33CCFF]" style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">คลังภาพเก่าล่าสุด</h3>
            <Link href="/gallery" className="text-sm font-medium text-[#0099FF]">
              ดูทั้งหมด
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {gallery.slice(0, 2).map((item) => (
              <div key={item.id} className="group flex items-center gap-3 rounded-xl bg-[#F5FAFF] p-2.5 transition hover:bg-[#EAF6FF]">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                  <img src={item.image} className="h-full w-full object-cover" alt="" />
                  {item.locked ? <div className="absolute inset-0 bg-slate-900/30" /> : null}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-400">
                    {item.generation}
                    {item.locked ? ' · 🔒 ล็อกอยู่' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured candidates */}
      <section className="rounded-[28px] border border-white bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0099FF]">Hall of Fame 2569</p>
            <h3 className="text-lg font-semibold text-slate-900">ผู้เข้าชิงศิษย์เก่าดีเด่นปีนี้</h3>
          </div>
          <Link href="/hall-of-fame" className="inline-flex items-center gap-1 text-sm font-semibold text-[#0099FF]">
            ดูทั้งหมด <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {profiles.map((profile, i) => (
            <div key={profile.id} className="group overflow-hidden rounded-2xl border border-slate-100 transition hover:shadow-xl">
              <div className="relative h-40 overflow-hidden">
                <img
                  src={profile.image}
                  alt={profile.name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
                <span className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-[#0099FF]">
                  #{i + 1}
                </span>
                <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#0099FF]">
                  {profile.hof_points} คะแนน
                </span>
              </div>
              <div className="p-4">
                <p className="font-semibold text-slate-900">{profile.name}</p>
                <p className="text-sm text-slate-400">{profile.generation}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{profile.achievement}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}