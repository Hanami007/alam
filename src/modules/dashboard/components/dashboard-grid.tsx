import Link from 'next/link';
import { ArrowRight, BadgeCheck, CalendarDays, ImageIcon, MapPin, Users } from 'lucide-react';
import { alumniProfiles, feedPosts, galleryItems } from '@/lib/data';

export function DashboardGrid() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.6fr_0.9fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Latest news</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">A modern alumni experience, built for growth.</h1>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <BadgeCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            The platform is now organized into modular experience layers for feed, hall of fame, map, profile, gallery, and administrative operations.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/feed" className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Open feed</Link>
            <Link href="/hall-of-fame" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Explore hall of fame</Link>
          </div>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-blue-600 to-sky-500 p-7 text-white shadow-sm">
          <p className="text-sm font-medium text-blue-100">Upcoming activities</p>
          <h2 className="mt-3 text-2xl font-semibold">Reunion & Awards Night</h2>
          <div className="mt-5 space-y-3 text-sm text-blue-50">
            <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> 24 Aug · 6:30 PM</div>
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Grand Hall, Bangkok</div>
            <div className="flex items-center gap-2"><Users className="h-4 w-4" /> 320 confirmed alumni</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Number of Alumni', value: '12.4k', delta: '+8.2%' },
            { label: 'Number of Generations', value: '24', delta: '+2' },
            { label: 'Outstanding Alumni', value: '186', delta: '+14' },
          ].map((item) => (
            <div key={item.label} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{item.label}</p>
              <div className="mt-2 flex items-end justify-between">
                <p className="text-2xl font-semibold text-slate-900">{item.value}</p>
                <span className="text-sm font-medium text-emerald-600">{item.delta}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Latest photos</h3>
            <Link href="/gallery" className="text-sm font-medium text-blue-600">View all</Link>
          </div>
          <div className="mt-4 grid gap-3">
            {galleryItems.slice(0, 2).map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.album} · {item.generation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Recent alumni</p>
            <h3 className="text-xl font-semibold text-slate-900">Featured professionals</h3>
          </div>
          <Link href="/hall-of-fame" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {alumniProfiles.map((profile) => (
            <div key={profile.id} className="rounded-[24px] border border-slate-200 p-4">
              <img src={profile.image} alt={profile.name} className="h-36 w-full rounded-2xl object-cover" />
              <div className="mt-3">
                <p className="font-semibold text-slate-900">{profile.name}</p>
                <p className="text-sm text-slate-500">{profile.department} · {profile.generation}</p>
                <p className="mt-2 text-sm text-slate-600">{profile.achievement}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Wall activity</p>
            <h3 className="text-xl font-semibold text-slate-900">Pinned and recent posts</h3>
          </div>
          <Link href="/feed" className="text-sm font-semibold text-blue-600">Visit wall</Link>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {feedPosts.map((post) => (
            <div key={post.id} className="rounded-[24px] border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">{post.title}</p>
                {post.pinned ? <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">Pinned</span> : null}
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600">{post.body}</p>
              <p className="mt-3 text-sm text-slate-500">{post.author} · {post.createdAt}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
