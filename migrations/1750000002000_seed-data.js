/* eslint-disable camelcase */

/**
 * Migration 003 — Seed Data (ข้อมูลอ้างอิงที่ระบบต้องมี)
 *
 * - lookup_options: จังหวัดครบ 77 จังหวัด, career_types, emoji
 *   (รุ่นสร้างใน migration 005 จากสูตรรหัสนักศึกษา)
 * - users: บัญชีแอดมิน 1 บัญชี (ยังไม่มีรหัสผ่าน ต้องตั้งเองก่อนล็อกอินครั้งแรก)
 *
 * เดิมไฟล์นี้มีคนสมมติ โพสต์ โพล Hall of Fame และรูปตัวอย่างด้วย — ตัดออกแล้ว
 * (DB ที่เคย seed ไปแล้วล้างด้วย migration 1750000017000_remove-mock-data.js)
 */

exports.up = (pgm) => {
  // ─── lookup_options ─────────────────────────────────────────────────────────
  pgm.sql(`
    INSERT INTO lookup_options (category, code, label, extra) VALUES
    -- ภาคกลาง
    ('province', 'th-bkk', 'กรุงเทพมหานคร',       '{"region":"กลาง","metro":true}'),
    ('province', 'th-nnt', 'นนทบุรี',              '{"region":"กลาง","metro":true}'),
    ('province', 'th-ptt', 'ปทุมธานี',             '{"region":"กลาง","metro":true}'),
    ('province', 'th-skp', 'สมุทรปราการ',          '{"region":"กลาง","metro":true}'),
    ('province', 'th-sks', 'สมุทรสาคร',            '{"region":"กลาง","metro":true}'),
    ('province', 'th-nkp', 'นครปฐม',               '{"region":"กลาง","metro":true}'),
    ('province', 'th-sksg','สมุทรสงคราม',          '{"region":"กลาง","metro":false}'),
    ('province', 'th-ayt', 'พระนครศรีอยุธยา',      '{"region":"กลาง","metro":false}'),
    ('province', 'th-agt', 'อ่างทอง',              '{"region":"กลาง","metro":false}'),
    ('province', 'th-lpb', 'ลพบุรี',               '{"region":"กลาง","metro":false}'),
    ('province', 'th-sib', 'สิงห์บุรี',            '{"region":"กลาง","metro":false}'),
    ('province', 'th-cnt', 'ชัยนาท',               '{"region":"กลาง","metro":false}'),
    ('province', 'th-sbr', 'สระบุรี',              '{"region":"กลาง","metro":false}'),
    ('province', 'th-nyk', 'นครนายก',              '{"region":"กลาง","metro":false}'),
    ('province', 'th-spb', 'สุพรรณบุรี',           '{"region":"กลาง","metro":false}'),
    ('province', 'th-uti', 'อุทัยธานี',            '{"region":"กลาง","metro":false}'),
    ('province', 'th-nsw', 'นครสวรรค์',            '{"region":"กลาง","metro":false}'),

    -- ภาคเหนือ
    ('province', 'th-cnx', 'เชียงใหม่',            '{"region":"เหนือ","metro":false}'),
    ('province', 'th-crn', 'เชียงราย',             '{"region":"เหนือ","metro":false}'),
    ('province', 'th-lpn', 'ลำปาง',                '{"region":"เหนือ","metro":false}'),
    ('province', 'th-lph', 'ลำพูน',                '{"region":"เหนือ","metro":false}'),
    ('province', 'th-msn', 'แม่ฮ่องสอน',           '{"region":"เหนือ","metro":false}'),
    ('province', 'th-nan', 'น่าน',                 '{"region":"เหนือ","metro":false}'),
    ('province', 'th-pyo', 'พะเยา',                '{"region":"เหนือ","metro":false}'),
    ('province', 'th-pre', 'แพร่',                 '{"region":"เหนือ","metro":false}'),
    ('province', 'th-utd', 'อุตรดิตถ์',            '{"region":"เหนือ","metro":false}'),
    ('province', 'th-tak', 'ตาก',                  '{"region":"เหนือ","metro":false}'),
    ('province', 'th-skt', 'สุโขทัย',              '{"region":"เหนือ","metro":false}'),
    ('province', 'th-pls', 'พิษณุโลก',             '{"region":"เหนือ","metro":false}'),
    ('province', 'th-pcb', 'พิจิตร',               '{"region":"เหนือ","metro":false}'),
    ('province', 'th-kpp', 'กำแพงเพชร',            '{"region":"เหนือ","metro":false}'),
    ('province', 'th-pnb', 'เพชรบูรณ์',            '{"region":"เหนือ","metro":false}'),

    -- ภาคอีสาน
    ('province', 'th-nma', 'นครราชสีมา',           '{"region":"อีสาน","metro":false}'),
    ('province', 'th-brm', 'บุรีรัมย์',            '{"region":"อีสาน","metro":false}'),
    ('province', 'th-srn', 'สุรินทร์',             '{"region":"อีสาน","metro":false}'),
    ('province', 'th-ssk', 'ศรีสะเกษ',             '{"region":"อีสาน","metro":false}'),
    ('province', 'th-ubn', 'อุบลราชธานี',          '{"region":"อีสาน","metro":false}'),
    ('province', 'th-yso', 'ยโสธร',                '{"region":"อีสาน","metro":false}'),
    ('province', 'th-cpm', 'ชัยภูมิ',              '{"region":"อีสาน","metro":false}'),
    ('province', 'th-amc', 'อำนาจเจริญ',           '{"region":"อีสาน","metro":false}'),
    ('province', 'th-nbl', 'หนองบัวลำภู',          '{"region":"อีสาน","metro":false}'),
    ('province', 'th-kkc', 'ขอนแก่น',              '{"region":"อีสาน","metro":false}'),
    ('province', 'th-udt', 'อุดรธานี',             '{"region":"อีสาน","metro":false}'),
    ('province', 'th-loe', 'เลย',                  '{"region":"อีสาน","metro":false}'),
    ('province', 'th-nkh', 'หนองคาย',              '{"region":"อีสาน","metro":false}'),
    ('province', 'th-msk', 'มหาสารคาม',            '{"region":"อีสาน","metro":false}'),
    ('province', 'th-ret', 'ร้อยเอ็ด',             '{"region":"อีสาน","metro":false}'),
    ('province', 'th-kls', 'กาฬสินธุ์',            '{"region":"อีสาน","metro":false}'),
    ('province', 'th-skn', 'สกลนคร',               '{"region":"อีสาน","metro":false}'),
    ('province', 'th-nph', 'นครพนม',               '{"region":"อีสาน","metro":false}'),
    ('province', 'th-mdh', 'มุกดาหาร',             '{"region":"อีสาน","metro":false}'),
    ('province', 'th-bkn', 'บึงกาฬ',              '{"region":"อีสาน","metro":false}'),

    -- ภาคตะวันออก
    ('province', 'th-cbi', 'ชลบุรี',               '{"region":"ตะวันออก","metro":false}'),
    ('province', 'th-ryg', 'ระยอง',                '{"region":"ตะวันออก","metro":false}'),
    ('province', 'th-cnb', 'จันทบุรี',             '{"region":"ตะวันออก","metro":false}'),
    ('province', 'th-trt', 'ตราด',                 '{"region":"ตะวันออก","metro":false}'),
    ('province', 'th-cch', 'ฉะเชิงเทรา',           '{"region":"ตะวันออก","metro":false}'),
    ('province', 'th-prc', 'ปราจีนบุรี',           '{"region":"ตะวันออก","metro":false}'),
    ('province', 'th-skw', 'สระแก้ว',              '{"region":"ตะวันออก","metro":false}'),

    -- ภาคตะวันตก
    ('province', 'th-knb', 'กาญจนบุรี',            '{"region":"ตะวันตก","metro":false}'),
    ('province', 'th-rbr', 'ราชบุรี',              '{"region":"ตะวันตก","metro":false}'),
    ('province', 'th-pbi', 'เพชรบุรี',             '{"region":"ตะวันตก","metro":false}'),
    ('province', 'th-pkk', 'ประจวบคีรีขันธ์',      '{"region":"ตะวันตก","metro":false}'),

    -- ภาคใต้
    ('province', 'th-nst', 'นครศรีธรรมราช',        '{"region":"ใต้","metro":false}'),
    ('province', 'th-kbi', 'กระบี่',               '{"region":"ใต้","metro":false}'),
    ('province', 'th-pna', 'พังงา',                '{"region":"ใต้","metro":false}'),
    ('province', 'th-phk', 'ภูเก็ต',               '{"region":"ใต้","metro":false}'),
    ('province', 'th-sni', 'สุราษฎร์ธานี',          '{"region":"ใต้","metro":false}'),
    ('province', 'th-rng', 'ระนอง',                '{"region":"ใต้","metro":false}'),
    ('province', 'th-cpn', 'ชุมพร',                '{"region":"ใต้","metro":false}'),
    ('province', 'th-skl', 'สงขลา',                '{"region":"ใต้","metro":false}'),
    ('province', 'th-stn', 'สตูล',                 '{"region":"ใต้","metro":false}'),
    ('province', 'th-trg', 'ตรัง',                 '{"region":"ใต้","metro":false}'),
    ('province', 'th-plg', 'พัทลุง',               '{"region":"ใต้","metro":false}'),
    ('province', 'th-ptn', 'ปัตตานี',              '{"region":"ใต้","metro":false}'),
    ('province', 'th-yla', 'ยะลา',                 '{"region":"ใต้","metro":false}'),
    ('province', 'th-nrt', 'นราธิวาส',             '{"region":"ใต้","metro":false}'),

    -- career types
    ('career_type', 'career-gov',      'ราชการ',          '{}'),
    ('career_type', 'career-private',  'เอกชน',           '{}'),
    ('career_type', 'career-own',      'ธุรกิจส่วนตัว',   '{}'),
    ('career_type', 'career-freelance','ฟรีแลนซ์',        '{}'),

    -- emoji reactions
    ('emoji', 'like', '👍 ถูกใจ', '{}'),
    ('emoji', 'love', '❤️ รักเลย', '{}');
  `);

  // ─── users ──────────────────────────────────────────────────────────────────
  pgm.sql(`
    INSERT INTO users (
      student_id, citizen_id_hash, email, name,
      generation_option_id, province_option_id, career_option_id,
      company, position, bio, avatar_url,
      role, status, total_points,
      hometown_province_id, work_province_id,
      show_hometown_on_map, show_workplace_on_map,
      student_status, expected_graduation_year
    ) VALUES
    -- Admin (id=1)
    (null, null, 'admin@uni.ac.th', 'ผู้ดูแลระบบ',
      null, null, null, null, null, null, null,
      'admin', 'approved', 0, null, null, false, false, 'alumni', null);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM users WHERE role = 'admin' AND email = 'admin@uni.ac.th';
    DELETE FROM lookup_options WHERE category IN ('province', 'career_type', 'emoji');
  `);
};
