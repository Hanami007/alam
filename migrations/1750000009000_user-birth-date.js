/* eslint-disable camelcase */

/**
 * Migration 009 — User Birth Date
 *
 * ฟีเจอร์ "วันเกิดประจำเดือน" ในหน้าฟีดเคยใช้ข้อมูลตัวอย่าง (hardcode) เพราะระบบ
 * ไม่เคยเก็บวันเกิดจริงของสมาชิกเลย เพิ่มคอลัมน์ users.birth_date เพื่อให้สมัคร
 * สมาชิกใหม่กรอกได้ และสมาชิกเดิมแก้ไขย้อนหลังได้จากหน้าทำเนียบรุ่น (self-edit)
 * แล้ว widget จะคำนวณจากวันที่จริงว่าใครถึงวันเกิดวันนี้
 */

exports.up = (pgm) => {
  pgm.addColumns('users', {
    birth_date: { type: 'date' },
  }, { ifNotExists: true });
};

exports.down = (pgm) => {
  pgm.dropColumns('users', ['birth_date'], { ifExists: true });
};
