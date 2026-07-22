import { Heart, MessageCircle, Pin, Share2 } from 'lucide-react';
import { getFeedPosts } from '@/lib/db';

export async function FeedList() {
  const posts = await getFeedPosts();

  return (
    <div className="space-y-5">
      {posts.map((post) => (
        <article
          key={post.id}
          className="overflow-hidden rounded-[28px] border border-white bg-white shadow-sm transition hover:shadow-lg"
        >
          <div className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0099FF] to-[#6495ED] text-sm font-semibold text-white">
                  {post.author?.slice(0, 1)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0099FF]">{post.category}</p>
                  <h2 className="mt-0.5 text-xl font-bold text-slate-900">{post.title}</h2>
                  <p className="mt-1.5 text-sm text-slate-400">
                    {post.author} · {new Date(post.created_at).toLocaleDateString('th-TH')}
                  </p>
                </div>
              </div>
              {post.pinned ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#EAF6FF] px-3 py-1 text-xs font-semibold text-[#0099FF]">
                  <Pin className="h-3.5 w-3.5" /> ปักหมุด
                </span>
              ) : null}
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">{post.body}</p>

            {post.poll ? (
              <div className="mt-5 rounded-2xl bg-gradient-to-br from-[#F5FAFF] to-[#EAF6FF] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{post.poll.question}</p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#0099FF] shadow-sm">
                    +{post.poll.pointsPerVote} คะแนน
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {post.poll.options.map((option: { id: number; text: string; votes: number }) => {
                    const total = post.poll!.options.reduce((sum: number, o: { votes: number }) => sum + o.votes, 0) || 1;
                    const pct = Math.round((option.votes / total) * 100);
                    return (
                      <button
                        key={option.id}
                        className="w-full rounded-xl border border-white bg-white px-4 py-2.5 text-left text-sm text-slate-700 shadow-sm transition hover:border-[#0099FF]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{option.text}</span>
                          <span className="text-slate-400">{option.votes} โหวต</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EAF6FF]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#0099FF] to-[#33CCFF]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="mt-5 flex items-center gap-3 text-sm text-slate-500">
              <button className="flex items-center gap-2 rounded-full bg-[#F5FAFF] px-3.5 py-2 transition hover:bg-[#EAF6FF] hover:text-[#0099FF]">
                <Heart className="h-4 w-4" /> {post.likes}
              </button>
              <button className="flex items-center gap-2 rounded-full bg-[#F5FAFF] px-3.5 py-2 transition hover:bg-[#EAF6FF] hover:text-[#0099FF]">
                <MessageCircle className="h-4 w-4" /> {post.comments}
              </button>
              <button className="flex items-center gap-2 rounded-full bg-[#F5FAFF] px-3.5 py-2 transition hover:bg-[#EAF6FF] hover:text-[#0099FF]">
                <Share2 className="h-4 w-4" /> แชร์
              </button>
              <span className="ml-auto rounded-full bg-[#EAF6FF] px-2.5 py-1 text-xs font-semibold text-[#0099FF]">
                คอมเมนต์ได้ +{post.commentPoints} คะแนน
              </span>
            </div>

            <input
              placeholder="เขียนคอมเมนต์..."
              className="mt-4 w-full rounded-xl border border-slate-200 bg-[#F5FAFF] px-4 py-2.5 text-sm outline-none focus:border-[#0099FF] focus:bg-white"
            />
          </div>
        </article>
      ))}
    </div>
  );
}