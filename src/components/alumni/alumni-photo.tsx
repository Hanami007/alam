'use client';

import { useState } from 'react';

interface AlumniPhotoProps {
  generation?: string | number | null; // เช่น "รุ่น 25", 25, "รุ่น32"
  studentId?: string | null;           // เช่น "60010045"
  name?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function AlumniPhoto({
  generation,
  studentId,
  name = 'ศิษย์เก่า',
  className = '',
  size = 'md',
}: AlumniPhotoProps) {
  const [hasError, setHasError] = useState(false);

  // ดึงตัวเลขรุ่น เช่น "รุ่น 25" -> "25"
  const genNumber = generation ? String(generation).replace(/[^0-9]/g, '') : '';
  // ดึงรหัส 3 ตัวท้าย เช่น "60010045" -> "045"
  const code3 = studentId ? studentId.trim().slice(-3) : '';

  // สร้าง Proxy URL ไปยัง Backend
  const photoUrl = genNumber && code3
    ? `/api/nas/image/${encodeURIComponent(`รุ่น ${genNumber}`)}/${code3}`
    : code3
    ? `/api/nas/image/${code3}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`;

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-16 w-16 text-base',
    xl: 'h-24 w-24 text-xl',
  }[size];

  if (hasError || (!genNumber && !code3)) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 font-extrabold text-white shadow-xs ${sizeClasses} ${className}`}
      >
        {name.substring(0, 2)}
      </div>
    );
  }

  return (
    <img
      src={photoUrl}
      alt={name}
      loading="lazy"
      onError={() => setHasError(true)}
      className={`rounded-2xl object-cover border border-slate-200 shadow-2xs ${sizeClasses} ${className}`}
    />
  );
}
