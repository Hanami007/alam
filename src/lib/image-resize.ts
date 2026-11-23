/**
 * ย่อรูปที่ผู้ใช้เลือกให้เป็น data URL ขนาดเล็ก (JPEG) ก่อนส่งขึ้น server
 *
 * ปัญหาเดิม: อ่านไฟล์เต็มขนาดด้วย readAsDataURL ตรงๆ รูปจากมือถือ 2–5MB กลายเป็น base64 ใหญ่ขึ้นอีก ~33%
 * เกินเพดาน body ของ nginx (ค่า default 1MB) → ได้ 413 และข้อมูลไม่ถูกบันทึกลง DB
 * รูปโปรไฟล์แสดงแค่ไม่กี่ร้อย px อยู่แล้ว ย่อเหลือด้านยาวสุด 512px ได้ไฟล์ราว 30–80KB
 */
export async function resizeImageToDataUrl(
  file: File,
  maxSize = 512,
  quality = 0.85
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
  }

  const sourceUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพนี้ได้'));
      el.src = sourceUrl;
    });

    const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('เบราว์เซอร์นี้ไม่รองรับการย่อรูปภาพ');

    // พื้นขาวรองไว้ก่อน — PNG โปร่งใสแปลงเป็น JPEG แล้วพื้นจะกลายเป็นสีดำ
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}
