'use client';
import { useState } from 'react';

interface Photo {
  id: number;
  image_url: string;
  caption: string;
}

interface ProfileCardProps {
  user: any;
  taggedPhotos: Photo[];
  unlockedPhotos: Photo[];
}

export function ProfileCard({ user, taggedPhotos = [], unlockedPhotos = [] }: ProfileCardProps) {
  const [activeAlbum, setActiveAlbum] = useState<'tagged' | 'unlocked'>('tagged');

  if (!user) {
    return <p className="text-sm text-slate-400">ไม่พบข้อมูลผู้ใช้ (ยังไม่ได้ตั้งค่า session ผู้ใช้ปัจจุบัน)</p>;
  }

  const photos = activeAlbum === 'tagged' ? taggedPhotos : unlockedPhotos;

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <img src={user.avatar_url} alt={user.name} className="h-20 w-20 rounded-2xl object-cover" />
          <div>
            <p className="text-xl font-semibold text-slate-900">{user.name}</p>
            <p className="text-sm text-slate-500">{user.generation} · {user.student_status === 'alumni' ? 'ศิษย์เก่า' : 'นักศึกษาปัจจุบัน'}</p>
            <p className="text-sm text-slate-500">{user.company} {user.position ? `· ${user.position}` : ''}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveAlbum('tagged')}
            className={activeAlbum === 'tagged' ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
          >
            รูปที่มีคุณ ({taggedPhotos.length})
          </button>
          <button
            onClick={() => setActiveAlbum('unlocked')}
            className={activeAlbum === 'unlocked' ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
          >
            รูปที่คุณตอบคำถาม ({unlockedPhotos.length})
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo) => (
            <img
              key={photo.id}
              src={photo.image_url}
              alt={photo.caption}
              className="aspect-square w-full rounded-xl object-cover"
            />
          ))}
          {photos.length === 0 && (
            <p className="col-span-full text-sm text-slate-400">ยังไม่มีรูปในอัลบั้มนี้</p>
          )}
        </div>
      </div>
    </div>
  );
}