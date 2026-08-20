'use client';
import { useState } from 'react';
import {
  Briefcase, GraduationCap, ImageIcon, MessageSquareText, Sparkles,
  Mail, MapPin, BadgeCheck, Vote, MessageCircle, Star, Lock, Clock,
} from 'lucide-react';

interface Photo {
  id: number;
  image_url: string;
  watermark_url?: string | null;
  caption: string;
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

  if (!user) {
    return (
      <div className="card-elevated p-8 text-center text-sm text-muted-foreground">
        ไม่พบข้อมูลผู้ใช้ (ยังไม่ได้ตั้งค่า session ผู้ใช้ปัจจุบัน)
      </div>
    );
  }

  const photos = activeAlbum === 'tagged' ? taggedPhotos : unlockedPhotos;
  const level = Math.floor((user.total_points ?? 0) / POINTS_PER_LEVEL) + 1;
  const progressInLevel = (user.total_points ?? 0) % POINTS_PER_LEVEL;
  const progressPct = Math.round((progressInLevel / POINTS_PER_LEVEL) * 100);

  return (
    <div className="animate-slide-up space-y-6">
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
            <h2 className="text-2xl font-extrabold tracking-tight">{user.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-white/85">
              <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {user.generation ?? 'ยังไม่ระบุรุ่น'} · {user.student_status === 'alumni' ? 'ศิษย์เก่า' : 'นักศึกษาปัจจุบัน'}</span>
              {(user.company || user.position) && (
                <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {user.company} {user.position ? `· ${user.position}` : ''}</span>
              )}
            </div>

            <div className="mt-4 max-w-xs">
              <div className="flex items-center justify-between text-[11px] text-white/80">
                <span>คะแนนสะสม {user.total_points ?? 0} แต้ม</span>
                <span>อีก {POINTS_PER_LEVEL - progressInLevel} แต้มขึ้น Lv.{level + 1}</span>
              </div>
              <div className="progress-bar-track mt-1">
                <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        {/* ข้อมูลส่วนตัว */}
        <section className="card-elevated h-fit p-6">
          <h3 className="text-[15px] font-bold text-foreground">ข้อมูลส่วนตัว</h3>
          <dl className="mt-4 space-y-3 text-sm">
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
          <p className="text-2xl font-extrabold text-foreground">{taggedPhotos.length}</p>
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
        <h3 className="text-[15px] font-bold text-foreground">อัลบั้มของฉัน</h3>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setActiveAlbum('tagged')}
            className={activeAlbum === 'tagged' ? 'tag-base tag-approved' : 'tag-base tag-pending'}
          >
            รูปที่มีคุณ ({taggedPhotos.length})
          </button>
          <button
            onClick={() => setActiveAlbum('unlocked')}
            className={activeAlbum === 'unlocked' ? 'tag-base tag-approved' : 'tag-base tag-pending'}
          >
            รูปที่คุณตอบคำถาม ({unlockedPhotos.length})
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {photos.map((photo) => (
            <div key={photo.id} className="card-hover group overflow-hidden rounded-2xl bg-background">
              <img
                src={photo.watermark_url || photo.image_url}
                alt={photo.caption}
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.src !== photo.image_url && photo.image_url) {
                    img.src = photo.image_url; // ลอง fallback ไปรูปเบลอถ้ารูปเต็มพัง
                  } else {
                    img.style.display = 'none'; // ไม่มีรูปให้แสดงจริง ๆ ซ่อนแทนโชว์ไอคอนพัง
                  }
                }}
                className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          ))}
          {photos.length === 0 && (
            <p className="col-span-full rounded-2xl bg-background p-6 text-center text-sm text-muted-foreground">
              ยังไม่มีรูปในอัลบั้มนี้ — ลองไปตอบคำถามปลดล็อกรูปหรือให้เพื่อนแท็กคุณที่หน้าคลังภาพเก่าดูสิ
            </p>
          )}
        </div>
      </section>
    </div>
  );
}