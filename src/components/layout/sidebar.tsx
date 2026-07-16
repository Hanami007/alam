import Link from 'next/link';
import { Home, Newspaper, Trophy, Vote, Map, Images, UserCircle2, Search, Settings } from 'lucide-react';

const items = [
  { label: 'Dashboard', href: '/', icon: Home },
  { label: 'Wall / Feed', href: '/feed', icon: Newspaper },
  { label: 'Hall of Fame', href: '/hall-of-fame', icon: Trophy },
  { label: 'Alumni Voting', href: '/voting', icon: Vote },
  { label: 'Alumni Map', href: '/map', icon: Map },
  { label: 'Gallery', href: '/gallery', icon: Images },
  { label: 'My Profile', href: '/profile', icon: UserCircle2 },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-72 flex-col border-r border-slate-200 bg-slate-50/80 px-6 py-8 lg:flex">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Alam Platform</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Alumni Directory</h2>
      </div>
      <nav className="space-y-2">
        {items.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-blue-600"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Module ready for expansion</p>
        <p className="mt-2 text-sm text-slate-600">The system is scaffolded to host donation, job portal, mentorship, and more.</p>
      </div>
    </aside>
  );
}
