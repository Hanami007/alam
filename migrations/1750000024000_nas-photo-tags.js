/* eslint-disable camelcase */

/**
 * แท็กคนในรูปคลังภาพเก่า (รูปจาก NAS)
 *
 * ตาราง photo_tags เดิมผูกกับ media_assets แต่คลังภาพตอนนี้อ่านรูปจาก NAS ตรงๆ ไม่ผ่าน media_assets
 * จึงแท็กไม่ได้เลย — ตารางนี้ผูกกับ path ของรูปใน NAS แทน (เช่น "รุ่น 28/กิจกรรม/IMG_001.JPG")
 *
 * - แท็กตัวเอง ("นี่คือฉัน") → accepted ทันที
 * - แท็กเพื่อน → pending จนกว่าเจ้าตัวกดยอมรับ (ปฏิเสธ = ลบแถว)
 * - แท็กได้เฉพาะคนที่ปลดล็อกคลังภาพรุ่นนั้นแล้ว หรือแอดมิน (ตรวจใน nas-tag.service)
 */

exports.up = (pgm) => {
  pgm.createTable('nas_photo_tags', {
    id:                   { type: 'serial', primaryKey: true },
    photo_path:           { type: 'varchar(500)', notNull: true },
    generation_option_id: { type: 'integer', references: 'lookup_options(id)', onDelete: 'SET NULL' },
    tagged_user_id:       { type: 'integer', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    tagged_by:            { type: 'integer', references: 'users(id)', onDelete: 'SET NULL' },
    status:               { type: 'varchar(20)', notNull: true, default: 'pending' },
    created_at:           { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    responded_at:         { type: 'timestamptz' },
  }, { ifNotExists: true });

  pgm.addConstraint('nas_photo_tags', 'chk_nas_photo_tags_status', "CHECK (status IN ('pending','accepted'))");
  pgm.addConstraint('nas_photo_tags', 'nas_photo_tags_photo_user_uq', 'UNIQUE (photo_path, tagged_user_id)');
  pgm.createIndex('nas_photo_tags', ['tagged_user_id', 'status']);
};

exports.down = (pgm) => {
  pgm.dropTable('nas_photo_tags', { ifExists: true });
};
