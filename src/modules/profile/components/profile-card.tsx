import { BadgeCheck, Briefcase, Camera, EyeOff, Mail, MapPin, Trophy } from 'lucide-react';
import { getActivityLog, getUserProfile } from '@/lib/db';

export async function ProfileCard({ studentId = '60010001' }: { studentId?: string }) {
  const user = await getUserProfile(studentId);
  if (!user) {
    return <p className="text-sm text-slate-500">ไม่พบข้อมูลผู้ใช้</p>;
  }
  const activityLog = await getActivityLog(user.id);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="overflow-hidden rounded-[28px] border border-white bg-white shadow-sm">
          <div className="relative h-28 bg-gradient-to-br from-[#0099FF] via-[#1E90FF] to-[#6495ED]">
            <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
            <button className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur">
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <div className="px-6 pb-6">
            <img
              src={user.avatar_url}
              alt={user.name}
              className="-mt-12 h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-lg"
            />
            <p className="mt-3 text-lg font-bold text-slate-900">{user.name}</p>
            <p className="text-sm text-slate-400">{user.generation}</p>

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#EAF6FF] to-[#F5FAFF] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0099FF] text-white">
                  <Trophy className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-[#0099FF]">คะแนนสะสม</p>
              </div>
              <p className="text-lg font-bold text-[#0099FF]">{user.total_points}</p>
            </div>

            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-2.5">
                <BadgeCheck className="h-4 w-4 text-[#0099FF]" /> รหัสนักศึกษา: {user.student_id}
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-[#0099FF]" /> {user.email}
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-[#0099FF]" /> {user.province}
              </div>
              <div className="flex items-center gap-2.5">
                <Briefcase className="h-4 w-4 text-[#0099FF]" /> {user.position} · {user.company}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-500">แกลเลอรีของฉัน</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {user.galleryImages.map((src: string) => (
                  <img key={src} src={src} className="h-20 w-full rounded-xl object-cover shadow-sm" alt="รูปในโปรไฟล์" />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">รายละเอียดโปรไฟล์</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              ['รุ่น', user.generation],
              ['จังหวัด', user.province],
              ['ประเภทอาชีพ', user.career_type],
              ['ตำแหน่งงาน', user.position],
              ['บริษัท/หน่วยงาน', user.company],
              ['เกี่ยวกับฉัน', user.bio],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-[#F5FAFF] p-4 transition hover:bg-[#EAF6FF]">
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <p className="mt-2 text-sm text-slate-900">{value ?? '-'}</p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-900">กิจกรรมของฉัน</h4>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                <EyeOff className="h-3 w-3" /> Admin มองไม่เห็นส่วนนี้
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {activityLog.map((item: { description: string; points: number; created_at: string }, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-2xl bg-[#F5FAFF] px-4 py-3 text-sm transition hover:bg-[#EAF6FF]"
                >
                  <div>
                    <p className="text-slate-900">{item.description}</p>
                    <p className="text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString('th-TH')}</p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#0099FF] shadow-sm">
                    +{item.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}