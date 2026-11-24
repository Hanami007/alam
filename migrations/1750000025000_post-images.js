/* eslint-disable camelcase */

/**
 * รูปในโพสต์ — โพสต์ละไม่เกิน 4 รูป
 *
 * เดิม FeedPostItem มี imageUrl แต่ไม่มีที่เก็บจริง (route ไม่อ่านค่า, query ไม่ select, ไม่มีโค้ดไหน insert)
 * ไฟล์รูปเก็บใน data/uploads/posts/ ส่วน DB เก็บแค่ path (/api/uploads/posts/<uuid>.webp)
 * ลบโพสต์ = ลบแถวรูปตาม (ON DELETE CASCADE) ส่วนไฟล์บนดิสก์ feed.service ลบให้
 */

exports.up = (pgm) => {
  pgm.createTable('post_images', {
    id:         { type: 'serial', primaryKey: true },
    post_id:    { type: 'integer', notNull: true, references: 'posts(id)', onDelete: 'CASCADE' },
    image_url:  { type: 'varchar(255)', notNull: true },
    sort_order: { type: 'smallint', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  }, { ifNotExists: true });

  pgm.addConstraint('post_images', 'chk_post_images_sort_order', 'CHECK (sort_order BETWEEN 1 AND 4)');
  pgm.addConstraint('post_images', 'post_images_post_order_uq', 'UNIQUE (post_id, sort_order)');
};

exports.down = (pgm) => {
  pgm.dropTable('post_images', { ifExists: true });
};
