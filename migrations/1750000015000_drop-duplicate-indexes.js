/**
 * ลบ index ที่ซ้ำซ้อนกันโดยไม่ได้ตั้งใจ (มาจากหลาย migration ที่ต่างคนต่างเพิ่ม index บนคอลัมน์
 * เดียวกันโดยไม่รู้ว่ามีอยู่แล้ว) — index ซ้ำไม่ได้ช่วยให้ query เร็วขึ้นเลย แต่ทำให้ INSERT/UPDATE/DELETE
 * ทุกครั้งต้องเขียนซ้ำสอง เปลืองพื้นที่ดิสก์สอง และยิ่งทวีคูณต้นทุนขึ้นเรื่อยๆ ตามขนาดข้อมูลที่โตขึ้น
 * ตลอดอายุการใช้งานระบบ — เก็บ index ที่ตั้งชื่อสื่อความหมายกว่า/ครอบคลุมกว่าไว้เพียงตัวเดียวต่อคู่
 */
exports.up = (pgm) => {
  pgm.dropIndex('posts', [], { name: 'posts_status_index', ifExists: true });
  pgm.dropIndex('posts', [], { name: 'posts_published_at_index', ifExists: true });
  pgm.dropIndex('users', [], { name: 'users_status_index', ifExists: true });
  // idx_notifications_user_id ครอบคลุม (user_id, is_read) อยู่แล้ว ซึ่ง query ที่กรองแค่ user_id
  // เพียงอย่างเดียวก็ใช้ index นี้ได้เต็มประสิทธิภาพเหมือนกัน ไม่จำเป็นต้องมี index เดี่ยวซ้ำอีกตัว
  pgm.dropIndex('notifications', [], { name: 'notifications_user_id_index', ifExists: true });
};

exports.down = (pgm) => {
  pgm.createIndex('posts', 'status', { name: 'posts_status_index' });
  pgm.createIndex('posts', 'published_at', { name: 'posts_published_at_index' });
  pgm.createIndex('users', 'status', { name: 'users_status_index' });
  pgm.createIndex('notifications', 'user_id', { name: 'notifications_user_id_index' });
};
