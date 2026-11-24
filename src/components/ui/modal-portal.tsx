'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * แสดงป๊อปอัปที่ document.body แทนตำแหน่งเดิมใน component
 *
 * `position: fixed` จะอิงกรอบของ ancestor ที่มี transform / filter / backdrop-filter แทนหน้าจอ
 * (เช่น animate-slide-up ที่ fill-mode `both` ทิ้ง transform ค้างไว้หลังเล่นจบ) ฉากหลังมืดของป๊อปอัป
 * เลยคลุมแค่บางส่วนของจอ ไม่คลุมแถบเมนูด้านข้าง — ย้ายไป body จึงคลุมเต็มจอเสมอ
 * และล็อกการเลื่อนหน้าด้านหลังระหว่างที่ป๊อปอัปเปิดอยู่
 *
 * ใช้ครอบ element ตัวนอกสุดของป๊อปอัป (div ที่เป็น `fixed inset-0`)
 */
export function ModalPortal({ children }: { children: ReactNode }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // ป๊อปอัปเปิดจากการกดของผู้ใช้เท่านั้น ตอน render ฝั่ง server จึงไม่มีอะไรต้องแสดง
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}
