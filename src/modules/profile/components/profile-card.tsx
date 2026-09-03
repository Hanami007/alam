'use client';
import { useState, useEffect } from 'react';
import {
  Briefcase, GraduationCap, ImageIcon, MessageSquareText, Sparkles,
  Mail, MapPin, BadgeCheck, Vote, MessageCircle, Star, Lock, Clock,
  X, Tag, UserMinus, AlertTriangle, CheckCircle2, Eye, Calendar, User as UserIcon
} from 'lucide-react';

interface Photo {
  id: number;
  image_url: string;
  watermark_url?: string | null;
  caption: string;
  created_at?: string;
  tagged_by_name?: string;
}

interface ActivityItem {
  description: string;
  points: number;
  created_at: string;
}

interface ProfileCardProps {
  user: any;
  taggedPhotos: Photo[];
  unlockedPhotos: Photo[];
  activityLog: ActivityItem[];
}

const POINTS_PER_LEVEL = 20;

function activityIcon(description: string) {
  if (description.includes('คอมเมนต์')) return MessageCircle;
  if (description.includes('โหวตโพล')) return Vote;
  if (description.includes('Hall of Fame')) return Star;
  if (description.includes('ปลดล็อกรูป')) return Lock;
  return Sparkles;
}

export function ProfileCard({ user, taggedPhotos = [], unlockedPhotos = [], activityLog = [] }: ProfileCardProps) {
  const [activeAlbum, setActiveAlbum] = useState<'tagged' | 'unlocked'>('tagged');
  const [taggedPhotosList, setTaggedPhotosList] = useState<Photo[]>(taggedPhotos);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [photoToUntag, setPhotoToUntag] = useState<Photo | null>(null);
  const [isUntagging, setIsUntagging] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [isMentorship, setIsMentorship] = useState<boolean>(
    Boolean(user?.is_available_for_mentorship ?? user?.isAvailableForMentorship)
  );

  useEffect(() => {
    if (user) {
      setIsMentorship(Boolean(user?.is_available_for_mentorship ?? user?.isAvailableForMentorship));
    }
  }, [user]);

  if (!user) {
    return (
      <div className="card-elevated p-8 text-center text-sm text-muted-foreground">
        ไม่พบข้อมูลผู้ใช้ (ยังไม่ได้ตั้งค่า session ผู้ใช้ปัจจุบัน)
      </div>
    );
  }

  const photos = activeAlbum === 'tagged' ? taggedPhotosList : unlockedPhotos;
  const level = Math.floor((user.total_points ?? 0) / POINTS_PER_LEVEL) + 1;
  const progressInLevel = (user.total_points ?? 0) % POINTS_PER_LEVEL;
  const progressPct = Math.round((progressInLevel / POINTS_PER_LEVEL) * 100);

  // Handle Untag / Remove Tag
  async function confirmUntag() {
    if (!photoToUntag) return;
    setIsUntagging(true);
    try {
      const res = await fetch('/api/gallery/untag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaAssetId: photoToUntag.id, userId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setTaggedPhotosList((prev) => prev.filter((p) => p.id !== photoToUntag.id));
        if (selectedPhoto?.id === photoToUntag.id) {
          setSelectedPhoto(null);
        }
        setPhotoToUntag(null);
        setToastMessage({ message: 'ลบแท็กตัวคุณออกจากรูปภาพเรียบร้อยแล้ว ✨', type: 'success' });
        setTimeout(() => setToastMessage(null), 3500);
      } else {
        setToastMessage({ message: data.error || 'เกิดข้อผิดพลาดในการลบแท็ก', type: 'error' });
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err: any) {
      setToastMessage({ message: err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', type: 'error' });
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsUntagging(false);
    }
  }

  return (
    <div className="animate-slide-up space-y-6 relative">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-bounce-in flex items-center gap-3 rounded-2xl bg-white/95 px-5 py-3.5 shadow-hero border border-slate-200/80 backdrop-blur-md">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
            toastMessage.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
          }`}>
            {toastMessage.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          </div>
          <span className="text-sm font-bold text-slate-800">{toastMessage.message}</span>
        </div>
      )}

      {/* Hero card */}
      <section className="gradient-hero decor-blob-primary decor-dot-pattern relative overflow-hidden rounded-[28px] p-7 text-white shadow-hero">
        <div className="relative z-10 flex flex-wrap items-center gap-5">
          <div className="relative">
            <img
              src={user.avatar_url}
              alt={user.name}
              className="h-24 w-24 rounded-2xl border-4 border-white/30 object-cover shadow-blue-glow"
            />
            <span className="badge-points absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
              Lv.{level}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-extrabold tracking-tight">{user.name}</h2>
              {isMentorship && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/30 px-3.5 py-1 text-xs font-extrabold text-emerald-100 border border-emerald-300/50 backdrop-blur-md shadow-xs animate-pulse">
                  💬 ยินดีให้คำแนะนำรุ่นน้อง
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-white/85">
              <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {user.generation ?? 'ยังไม่ระบุรุ่น'} · {user.student_status === 'alumni' ? 'ศิษย์เก่า' : 'นักศึกษาปัจจุบัน'}</span>
              {(user.company || user.position) && (
                <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {user.company} {user.position ? `· ${user.position}` : ''}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        {/* ข้อมูลส่วนตัว */}
        <section className="card-elevated h-fit p-6 space-y-4">
          <h3 className="text-[15px] font-bold text-foreground">ข้อมูลส่วนตัว</h3>

          {/* Toggle เปิด/ปิด สถานะยินดีให้คำแนะนำ */}
          <div className="flex items-center justify-between rounded-2xl bg-emerald-50/80 p-3.5 border border-emerald-200/80 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-emerald-950">💬 ยินดีให้คำแนะนำรุ่นน้อง</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  {isMentorship ? 'เปิดใช้งาน — ป้ายจะแสดงบนโปรไฟล์และทุกที่' : 'ปิดอยู่ — กดเปิดเพื่อแสดงสถานะ'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                const next = !isMentorship;
                setIsMentorship(next);
                try {
                  await fetch('/api/user/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_available_for_mentorship: next }),
                  });
                } catch (err) {
                  console.error('[ProfileCard] Failed to update mentorship:', err);
                  setIsMentorship(!next); // revert on error
                }
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isMentorship ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isMentorship ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>


          <dl className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <dt className="text-[12px] text-muted-foreground">อีเมล</dt>
                <dd className="text-foreground">{user.email ?? '-'}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <dt className="text-[12px] text-muted-foreground">รหัสนักศึกษา</dt>
                <dd className="text-foreground">{user.student_id ?? '-'}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <dt className="text-[12px] text-muted-foreground">จังหวัด</dt>
                <dd className="text-foreground">{user.province ?? 'ยังไม่ระบุ'}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <dt className="text-[12px] text-muted-foreground">ประเภทอาชีพ</dt>
                <dd className="text-foreground">{user.career_type ?? 'ยังไม่ระบุ'}</dd>
              </div>
            </div>
            {user.bio && (
              <div className="border-t border-border pt-3">
                <dt className="text-[12px] text-muted-foreground">เกี่ยวกับฉัน</dt>
                <dd className="mt-1 text-foreground">{user.bio}</dd>
              </div>
            )}
          </dl>
        </section>

        {/* Activity log */}
        <section className="card-elevated p-6">
          <h3 className="text-[15px] font-bold text-foreground">กิจกรรมล่าสุด</h3>
          <div className="mt-4 space-y-3">
            {activityLog.length === 0 && (
              <p className="rounded-2xl bg-background p-4 text-sm text-muted-foreground">ยังไม่มีกิจกรรม ลองไปคอมเมนต์ โหวตโพล หรือตอบคำถามปลดล็อกรูปดูสิ</p>
            )}
            {activityLog.slice(0, 10).map((item, i) => {
              const Icon = activityIcon(item.description);
              return (
                <div key={i} className="flex items-center gap-3 rounded-2xl bg-background p-3">
                  <div className="stat-icon-badge h-9 w-9 bg-primary-light text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{item.description}</p>
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" /> {new Date(item.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  {item.points > 0 && <span className="badge-points shrink-0">+{item.points}</span>}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Stat mini cards */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="card-elevated card-hover p-4">
          <div className="stat-icon-badge bg-primary-light text-primary">
            <ImageIcon className="h-5 w-5" />
          </div>
          <p className="mt-2 text-[13px] text-muted-foreground">รูปที่มีคุณ</p>
          <p className="text-2xl font-extrabold text-foreground">{taggedPhotosList.length}</p>
        </div>
        <div className="card-elevated card-hover p-4">
          <div className="stat-icon-badge bg-primary-light text-primary">
            <MessageSquareText className="h-5 w-5" />
          </div>
          <p className="mt-2 text-[13px] text-muted-foreground">รูปที่ตอบคำถาม</p>
          <p className="text-2xl font-extrabold text-foreground">{unlockedPhotos.length}</p>
        </div>
        <div className="card-elevated card-hover p-4">
          <div className="stat-icon-badge bg-primary-light text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="mt-2 text-[13px] text-muted-foreground">คะแนนสะสม</p>
          <p className="text-2xl font-extrabold text-foreground">{user.total_points ?? 0}</p>
        </div>
      </section>

      {/* อัลบั้มรูป */}
      <section className="card-elevated p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-[15px] font-bold text-foreground">อัลบั้มของฉัน</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeAlbum === 'tagged'
                ? 'รูปภาพที่คุณถูกแท็กโดยเพื่อน สามารถแตะเพื่อดูรายละเอียดหรือลบแท็กของตนเองออกได้'
                : 'รูปภาพที่คุณตอบคำถามปลดล็อกด้วยตนเอง'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setActiveAlbum('tagged')}
            className={activeAlbum === 'tagged' ? 'tag-base tag-approved' : 'tag-base tag-pending'}
          >
            🏷️ รูปที่มีคุณ ({taggedPhotosList.length})
          </button>
          <button
            onClick={() => setActiveAlbum('unlocked')}
            className={activeAlbum === 'unlocked' ? 'tag-base tag-approved' : 'tag-base tag-pending'}
          >
            🔓 รูปที่คุณตอบคำถาม ({unlockedPhotos.length})
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="card-hover group relative overflow-hidden rounded-2xl bg-background border border-slate-200/70 shadow-2xs cursor-pointer"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img
                src={photo.watermark_url || photo.image_url}
                alt={photo.caption}
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.src !== photo.image_url && photo.image_url) {
                    img.src = photo.image_url;
                  } else {
                    img.style.display = 'none';
                  }
                }}
                className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Hover Overlay with Quick Actions */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                <div className="flex justify-end">
                  {activeAlbum === 'tagged' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPhotoToUntag(photo);
                      }}
                      className="flex items-center gap-1 rounded-full bg-rose-500/90 hover:bg-rose-600 text-white px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur-xs transition-transform active:scale-95"
                      title="ลบแท็กฉันออกจากรูปนี้"
                    >
                      <UserMinus className="h-3 w-3" />
                      <span>ลบแท็ก</span>
                    </button>
                  )}
                </div>

                <div className="text-white">
                  <p className="text-xs font-semibold truncate drop-shadow-sm">{photo.caption || 'รูปภาพกิจกรรม'}</p>
                  {photo.tagged_by_name && (
                    <p className="text-[10px] text-white/80 truncate">แท็กโดย {photo.tagged_by_name}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {photos.length === 0 && (
            <div className="col-span-full rounded-2xl bg-background p-8 text-center text-sm text-muted-foreground border border-dashed border-slate-200">
              <p className="font-semibold text-slate-700">ยังไม่มีรูปในอัลบั้มนี้</p>
              <p className="text-xs text-slate-400 mt-1">
                {activeAlbum === 'tagged'
                  ? 'เมื่อมีเพื่อนแท็กคุณในคลังภาพเก่า รูปภาพจะมาปรากฏที่นี่โดยอัตโนมัติ'
                  : 'ลองไปตอบคำถามปลดล็อกรูปที่หน้าคลังภาพเก่าเพื่อเก็บสะสมรูปภาพของคุณ'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ===== PHOTO PREVIEW LIGHTBOX MODAL ===== */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-[32px] overflow-hidden shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Photo Image */}
            <div className="relative aspect-4/3 w-full bg-slate-900 flex items-center justify-center overflow-hidden">
              <img
                src={selectedPhoto.image_url || selectedPhoto.watermark_url || ''}
                alt={selectedPhoto.caption}
                className="h-full w-full object-contain"
              />
            </div>

            {/* Photo Info & Untag Action */}
            <div className="p-6 sm:p-7 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{selectedPhoto.caption || 'รูปภาพความทรงจำ'}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                    {selectedPhoto.tagged_by_name && (
                      <span className="flex items-center gap-1 text-purple-600 font-medium">
                        <UserIcon className="h-3.5 w-3.5" /> แท็กโดย: {selectedPhoto.tagged_by_name}
                      </span>
                    )}
                    {selectedPhoto.created_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> {new Date(selectedPhoto.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>

                {activeAlbum === 'tagged' && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoToUntag(selectedPhoto);
                    }}
                    className="flex items-center gap-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-4 py-2 text-xs font-bold transition-all hover:scale-105 active:scale-95 shrink-0"
                  >
                    <UserMinus className="h-4 w-4 text-rose-500" />
                    <span>ลบแท็กตัวฉันออก</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== UNTAG CONFIRMATION DIALOG MODAL ===== */}
      {photoToUntag && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => !isUntagging && setPhotoToUntag(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 animate-scale-up space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 border border-rose-200">
                <UserMinus className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">ยืนยันการลบแท็ก</h3>
                <p className="text-xs text-slate-400">ลบแท็กตัวคุณออกจากรูปนี้</p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-xs sm:text-sm text-slate-600 space-y-1.5 border border-slate-100">
              <p className="font-semibold text-slate-800">
                คุณต้องการลบแท็กชื่อของคุณออกจากรูปภาพนี้ใช่หรือไม่?
              </p>
              <p className="text-slate-500 text-xs leading-relaxed">
                • รูปนี้จะไม่แสดงในหน้าโปรไฟล์และอัลบั้มของคุณอีกต่อไป<br />
                • รูปภาพต้นฉบับในคลังภาพยังคงอยู่ตามปกติ
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isUntagging}
                onClick={() => setPhotoToUntag(null)}
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isUntagging}
                onClick={confirmUntag}
                className="flex items-center gap-1.5 rounded-full bg-rose-600 hover:bg-rose-700 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-all active:scale-95 disabled:opacity-50"
              >
                {isUntagging ? (
                  <>
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    <span>กำลังลบแท็ก...</span>
                  </>
                ) : (
                  <>
                    <UserMinus className="h-3.5 w-3.5" />
                    <span>ยืนยันลบแท็ก</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}