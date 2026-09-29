/* eslint-disable camelcase */

/**
 * แก้ปัญหา "เพดานรุ่นศิษย์เก่า": ระบบคำนวณเลขรุ่นอัตโนมัติจากรหัสนักศึกษา (prefix - 37) แต่ก่อนหน้านี้
 * lookup_options (category='generation') ต้องมีคนมา seed ไว้ล่วงหน้าเท่านั้น ตอนนี้ seed ไว้ถึงแค่
 * รุ่น 48 (~ปี 2585) เมื่อถึงรุ่นที่เกินนั้น นักศึกษาใหม่จะสมัครสมาชิกไม่ได้เลยเพราะไม่มีตัวเลือกรุ่น
 * ให้เลือก และต้องรอโปรแกรมเมอร์มารัน migration เพิ่มเองทุกปีไปตลอดกาล ซึ่งขัดกับเป้าหมายให้ระบบ
 * ดูแลตัวเองได้และใช้งานได้อย่างน้อย 10 ปีโดยไม่ต้องพึ่งคนเขียนโค้ด
 *
 * เพิ่ม UNIQUE (category, code) เพื่อให้โค้ดฝั่ง register ใช้ ON CONFLICT DO NOTHING ตอน
 * auto-create ตัวเลือกรุ่นใหม่แบบ on-the-fly ได้อย่างปลอดภัยแม้มีคนสมัครพร้อมกันหลายคน
 * (race condition) โดยไม่มีทางสร้างแถวซ้ำ
 */
exports.up = (pgm) => {
  pgm.addConstraint('lookup_options', 'lookup_options_category_code_uq', 'UNIQUE (category, code)');
};

exports.down = (pgm) => {
  pgm.dropConstraint('lookup_options', 'lookup_options_category_code_uq');
};
