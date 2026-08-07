import {
  CheckCircle2,
  Image as ImageIcon,
  MessageSquare,
  ShieldCheck,
  Star,
  Users,
  Vote,
  XCircle,
} from 'lucide-react';
import { getAdminOverviewStats, getPendingUsers, getPostRequests } from '@/lib/db';
import { PostRequestQueue } from './post-request-queue';

const CURRENT_ADMIN_ID = 1; // TODO: ดึงจาก session จริง (Admin มีคนเดียว)

export async function AdminDashboard() {
  const [pendingUsers, stats, postRequests] = await Promise.all([
    getPendingUsers(),
    getAdminOverviewStats(),
    getPostRequests(),
  ]);

  return (
    <div className="animate-slide-up space-y-6">
      {/* คำขอสร้างโพสต์ */}
      <PostRequestQueue requests={postRequests} adminId={CURRENT_ADMIN_ID} />

      {/* คิวอนุมัติศิษย์เก่า */}
      <section className="card-elevated p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">รออนุมัติ</p>
            <h2 className="text-[18px] font-bold text-foreground">คิวอนุมัติศิษย์เก่าใหม่</h2>
          </div>
          <span className="badge-points">{pendingUsers.length} รายการ</span>
        </div>

        <div className="mt-5 space-y-3">
          {pendingUsers.length === 0 ? (
            <p className="rounded-2xl bg-background p-4 text-sm text-muted-foreground">ไม่มีรายการรออนุมัติตอนนี้</p>
          ) : (
            pendingUsers.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-background p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{u.name}</p>
                  <p className="text-xs text-muted-foreground">
                    รหัส {u.student_id} · {u.generation ?? 'ยังไม่ระบุรุ่น'}
                  </p>
                  {u.registrar_status ? (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-primary">
                      <ShieldCheck className="h-3 w-3" /> Registrar API: {u.registrar_status}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-muted-foreground">ยังไม่มีผลตรวจสอบจาก Registrar API</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> อนุมัติ
                  </button>
                  <button className="tag-base tag-rejected px-4 py-2 text-xs font-semibold">
                    <XCircle className="h-3.5 w-3.5" /> ปฏิเสธ
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* สถิติภาพรวม */}
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'ศิษย์เก่าอนุมัติแล้ว', value: stats.approvedUsers, icon: Users },
          { label: 'โพสต์ทั้งหมด', value: stats.totalPosts, icon: MessageSquare },
          { label: 'โพลที่เปิดอยู่', value: stats.activePolls, icon: Vote },
          { label: 'อัลบั้มรูปเก่า', value: stats.totalAlbums, icon: ImageIcon },
        ].map((item) => (
          <div key={item.label} className="card-elevated card-hover p-5">
            <div className="stat-icon-badge bg-primary-light text-primary">
              <item.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-[13px] text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums text-foreground">{item.value}</p>
          </div>
        ))}
      </section>

      {/* จัดการแยกโมดูล */}
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <div className="card-elevated p-5">
          <div className="stat-icon-badge bg-primary-light text-primary">
            <MessageSquare className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-[15px] font-bold text-foreground">จัดการโพสต์ / คอมเมนต์</h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            โพสต์ {stats.totalPosts} · คอมเมนต์ {stats.totalComments} · รีแอกชัน {stats.totalReactions}
          </p>
        </div>

        <div className="card-elevated p-5">
          <div className="stat-icon-badge bg-primary-light text-primary">
            <Vote className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-[15px] font-bold text-foreground">จัดการโพล</h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            เปิดอยู่ {stats.activePolls} โพล · โหวตรวม {stats.totalPollVotes} เสียง
          </p>
        </div>

        <div className="card-elevated p-5">
          <div className="stat-icon-badge bg-primary-light text-primary">
            <Star className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-[15px] font-bold text-foreground">จัดการ Hall of Fame</h3>
          {stats.hofCampaign ? (
            <p className="mt-1 text-[13px] text-muted-foreground">
              {stats.hofCampaign.title} · สถานะ {stats.hofCampaign.status} · โหวตแล้ว {stats.hofCampaign.total_votes} ครั้ง
            </p>
          ) : (
            <p className="mt-1 text-[13px] text-muted-foreground">ยังไม่มีแคมเปญ</p>
          )}
        </div>

        <div className="card-elevated p-5">
          <div className="stat-icon-badge bg-primary-light text-primary">
            <ImageIcon className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-[15px] font-bold text-foreground">จัดการคลังภาพเก่า</h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {stats.totalAlbums} อัลบั้ม · รูป {stats.totalPhotos} รูป · แท็กแล้ว {stats.totalTags} ครั้ง
          </p>
        </div>

        <div className="card-elevated p-5">
          <div className="stat-icon-badge bg-primary-light text-primary">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-[15px] font-bold text-foreground">จัดการผู้ใช้</h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            รออนุมัติ {stats.pendingApprovals} · อนุมัติแล้ว {stats.approvedUsers}
          </p>
        </div>
      </section>
    </div>
  );
}