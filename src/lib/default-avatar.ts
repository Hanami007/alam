/**
 * รูปโปรไฟล์ตั้งต้นสำหรับคนที่ยังไม่อัปโหลดรูป — ไอคอนคนสีเทา (ไม่ใช่รูปคนจริง)
 * เดิมหนังสือรุ่นใช้รูปสต็อกของคนแปลกหน้าจาก unsplash แทน ทำให้ดูเหมือนเป็นรูปของสมาชิกคนนั้นจริง
 */
export const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#e2e8f0"/><circle cx="60" cy="46" r="22" fill="#94a3b8"/><path d="M18 120c4-26 21-40 42-40s38 14 42 40z" fill="#94a3b8"/></svg>'
  );
