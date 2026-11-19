/* eslint-disable camelcase */

/**
 * Migration 018 — ระบบรายงานเนื้อหา (ข้อ 5) + เปิด/ปิดการแสดงข้อมูลส่วนตัวรายฟิลด์ (ข้อ 6)
 *
 * 1) content_reports: ผู้ใช้กด "รายงาน" โพสต์/ความคิดเห็นที่หลุดตัวกรองคำ → เข้าคิวให้แอดมินซ่อนหรือลบ
 *    posts.is_hidden / post_interactions.is_hidden: ซ่อนจากฟีดโดยไม่ลบข้อมูล (ยกเลิกซ่อนได้)
 *
 * 2) users.show_email / show_birth_date / show_student_id / show_facebook / show_line_id
 *    เดิม /api/user/profile ส่งอีเมล วันเกิด และช่องทางติดต่อของทุกคนให้ผู้ใช้ทุกคนโดยไม่สนการตั้งค่า
 *    ค่า default = ปิด (privacy by default ตาม PDPA) ยกเว้นผู้ใช้เดิม:
 *    - show_birth_date = true เพื่อไม่ให้วิดเจ็ตวันเกิดหน้าฟีดที่เคยเห็นหายไปทันที (เจ้าของปิดเองได้)
 *    - show_facebook / show_line_id = ตาม show_contact_on_map เดิม (เคยเลือกเปิดเผยช่องทางติดต่อไว้แล้ว)
 */
exports.up = (pgm) => {
  pgm.createTable('content_reports', {
    id: { type: 'serial', primaryKey: true },
    target_type: { type: 'varchar(20)', notNull: true },
    target_id: { type: 'integer', notNull: true },
    reported_by: { type: 'integer', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    reason: { type: 'varchar(30)', notNull: true },
    detail: { type: 'varchar(500)' },
    status: { type: 'varchar(20)', notNull: true, default: 'pending' },
    resolved_by: { type: 'integer', references: 'users(id)', onDelete: 'SET NULL' },
    resolved_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('content_reports', 'chk_report_target_type', "CHECK (target_type IN ('post','comment'))");
  pgm.addConstraint(
    'content_reports',
    'chk_report_reason',
    "CHECK (reason IN ('inappropriate','spam','harassment','misinformation','other'))"
  );
  pgm.addConstraint(
    'content_reports',
    'chk_report_status',
    "CHECK (status IN ('pending','hidden','deleted','dismissed'))"
  );
  // คนเดียวรายงานเนื้อหาเดิมซ้ำไม่ได้ (กันปั๊มจำนวนรายงาน)
  pgm.addConstraint(
    'content_reports',
    'content_reports_unique_reporter',
    'UNIQUE (target_type, target_id, reported_by)'
  );
  pgm.createIndex('content_reports', ['status', 'created_at']);
  pgm.createIndex('content_reports', ['target_type', 'target_id']);

  pgm.addColumns('posts', { is_hidden: { type: 'boolean', notNull: true, default: false } });
  pgm.addColumns('post_interactions', { is_hidden: { type: 'boolean', notNull: true, default: false } });

  pgm.addColumns('users', {
    show_email: { type: 'boolean', notNull: true, default: false },
    show_birth_date: { type: 'boolean', notNull: true, default: false },
    show_student_id: { type: 'boolean', notNull: true, default: false },
    show_facebook: { type: 'boolean', notNull: true, default: false },
    show_line_id: { type: 'boolean', notNull: true, default: false },
  });
  pgm.sql(`
    UPDATE users
    SET show_birth_date = true,
        show_facebook = show_contact_on_map,
        show_line_id = show_contact_on_map;
  `);
};

exports.down = (pgm) => {
  pgm.dropColumns('users', ['show_email', 'show_birth_date', 'show_student_id', 'show_facebook', 'show_line_id']);
  pgm.dropColumns('post_interactions', ['is_hidden']);
  pgm.dropColumns('posts', ['is_hidden']);
  pgm.dropTable('content_reports');
};
