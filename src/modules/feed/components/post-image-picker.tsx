'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';

/**
 * เลือกรูปแนบโพสต์ (สูงสุด 4 รูป) — ย่อรูปในเบราว์เซอร์ก่อนส่ง (ด้านยาว 1600px, JPEG)
 * รูปจากมือถือมักใหญ่ 5–12MB ถ้าส่งไฟล์เดิม 4 รูปจะหนักหลายสิบ MB ต่อคำขอ
 * ฝั่ง server ยังตรวจชนิด/ขนาดซ้ำ และแปลงเป็น webp อีกรอบ (upload-storage.ts)
 */

export const MAX_POST_IMAGES = 4;
const MAX_SIDE = 1600;
const MAX_ORIGINAL_BYTES = 20 * 1024 * 1024;
const MAX_RESULT_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  // พื้นขาวกันส่วนโปร่งใสของ PNG กลายเป็นสีดำตอนแปลงเป็น JPEG
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.85);
}

export function PostImagePicker({
  images,
  onChange,
  disabled,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  async function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (inputRef.current) inputRef.current.value = '';
    if (files.length === 0) return;

    const room = MAX_POST_IMAGES - images.length;
    const problems: string[] = [];
    if (files.length > room) problems.push(`แนบได้อีก ${room} รูป (สูงสุด ${MAX_POST_IMAGES} รูปต่อโพสต์)`);

    setProcessing(true);
    const added: string[] = [];
    for (const file of files.slice(0, room)) {
      if (!ACCEPTED.includes(file.type)) {
        problems.push(`${file.name}: รองรับเฉพาะ JPG, PNG หรือ WebP`);
        continue;
      }
      if (file.size > MAX_ORIGINAL_BYTES) {
        problems.push(`${file.name}: ไฟล์ใหญ่เกิน 20MB`);
        continue;
      }
      try {
        const dataUrl = await compressImage(file);
        // base64 ใหญ่กว่าไฟล์จริงราว 4/3 เท่า
        if ((dataUrl.length * 3) / 4 > MAX_RESULT_BYTES) {
          problems.push(`${file.name}: ย่อแล้วยังใหญ่เกิน 5MB`);
          continue;
        }
        added.push(dataUrl);
      } catch {
        problems.push(`${file.name}: เปิดไฟล์รูปนี้ไม่ได้`);
      }
    }
    setProcessing(false);
    setError(problems.join(' · '));
    if (added.length > 0) onChange([...images, ...added]);
  }

  function removeAt(index: number) {
    onChange(images.filter((_, i) => i !== index));
    setError('');
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="block text-xs font-bold text-slate-600">รูปภาพ (ไม่บังคับ)</span>
        <span className="text-xs text-slate-400">
          {images.length}/{MAX_POST_IMAGES} รูป
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {images.map((src, i) => (
          <div key={i} className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL ตัวอย่างก่อนส่ง */}
            <img src={src} alt={`รูปที่ ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              disabled={disabled}
              aria-label={`ลบรูปที่ ${i + 1}`}
              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {images.length < MAX_POST_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || processing}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 text-xs font-semibold text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50"
          >
            {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            {processing ? 'กำลังย่อรูป' : 'เพิ่มรูป'}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error ? (
        <p className="mt-1.5 text-xs text-rose-500">{error}</p>
      ) : (
        <p className="mt-1.5 text-xs text-slate-400">JPG, PNG หรือ WebP · ระบบย่อรูปให้อัตโนมัติ</p>
      )}
    </div>
  );
}
