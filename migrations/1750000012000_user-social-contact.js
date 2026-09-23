/* eslint-disable camelcase */

/**
 * Migration 012 — User Social Contact (Facebook / LINE)
 *
 * เก็บ Facebook และ LINE ของสมาชิกไว้ใน users แก้ไขได้ทีหลังจากหน้าโปรไฟล์
 * และแสดงบน AlumniProfileModal ในหน้าแผนที่เมื่อคลิกดูศิษย์เก่าคนอื่น
 *
 * show_contact_on_map แยกจาก show_hometown_on_map/show_workplace_on_map ที่มีอยู่แล้ว —
 * สองอันนั้นคุมแค่ "ขึ้นเป็นหมุดบนแผนที่ไหม" ส่วนอันนี้คุม "เปิดให้คนอื่นเห็นช่องทางติดต่อ
 * เมื่อกดดูรายละเอียดไหม" เป็นคนละชั้นความเป็นส่วนตัว default เป็น false (opt-in) เพราะ
 * เป็นช่องทางติดต่อตรงตัว อ่อนไหวกว่าข้อมูลจังหวัด/ที่ทำงานทั่วไป
 */

exports.up = (pgm) => {
  pgm.addColumns('users', {
    facebook_url: { type: 'text' },
    line_id: { type: 'text' },
    show_contact_on_map: { type: 'boolean', notNull: true, default: false },
  }, { ifNotExists: true });
};

exports.down = (pgm) => {
  pgm.dropColumns('users', ['facebook_url', 'line_id', 'show_contact_on_map'], { ifExists: true });
};
