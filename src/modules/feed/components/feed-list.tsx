import { feedPosts } from '@/lib/data';
import { Heart, MessageCircle, Share2, Pin } from 'lucide-react';

export function FeedList() {
  return (
    <div className="space-y-4">
      {feedPosts.map((post) => (
        <article key={post.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-600">{post.category}</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">{post.title}</h2>
              <p className="mt-2 text-sm text-slate-500">{post.author} · {post.createdAt}</p>
            </div>
            {post.pinned ? <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600"><Pin className="h-3.5 w-3.5" /> Pinned</span> : null}
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">{post.body}</p>
          {post.image ? <img src={post.image} alt={post.title} className="mt-4 h-56 w-full rounded-[24px] object-cover" /> : null}
          <div className="mt-5 flex items-center gap-4 text-sm text-slate-500">
            <button className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 transition hover:bg-slate-100"><Heart className="h-4 w-4" /> {post.likes}</button>
            <button className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 transition hover:bg-slate-100"><MessageCircle className="h-4 w-4" /> {post.comments}</button>
            <button className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 transition hover:bg-slate-100"><Share2 className="h-4 w-4" /> Share</button>
          </div>
        </article>
      ))}
    </div>
  );
}
