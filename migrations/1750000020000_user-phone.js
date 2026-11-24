/* eslint-disable camelcase */

/**
 * เบอร์โทรศัพท์สมาชิก — ข้อมูลสำหรับแอดมินติดต่อเท่านั้น ไม่เปิดเผยต่อสมาชิกคนอื่น
 * (redactPrivateFields ใน src/modules/profile/services/user.service.ts ซ่อนเสมอ ไม่มี toggle ให้เปิด)
 * เก็บเป็นตัวเลขล้วน อาจมี + นำหน้า — ดู src/lib/phone.ts
 */

exports.up = (pgm) => {
  pgm.addColumns('users', {
    phone: { type: 'varchar(20)' },
  }, { ifNotExists: true });
};

exports.down = (pgm) => {
  pgm.dropColumns('users', ['phone'], { ifExists: true });
};
