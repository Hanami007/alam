import { AppShell } from '@/components/layout/app-shell';
import { FeedList } from '@/modules/feed/components/feed-list';

export default function FeedPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-blue-600">Wall / Feed</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Community feed</h1>
        </div>
        <FeedList />
      </div>
    </AppShell>
  );
}
