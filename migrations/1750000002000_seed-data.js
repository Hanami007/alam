/* eslint-disable camelcase */

/**
 * Migration 003 — Seed Data
 *
 * ข้อมูลจำลองสำหรับ development:
 * - lookup_options: generations (3 รุ่น), จังหวัดครบ 77 จังหวัด, career_types, emoji
 * - users: 1 admin + 13 alumni (รวมชุด 10 คนสำหรับ Hall of Fame)
 * - posts, polls, poll_votes, post_interactions
 * - hof_campaigns, hof_candidates, hof_votes
 * - media_assets, photo_tags, photo_view_verifications
 *
 * NOTE: migration นี้ทำ idempotent ไม่ได้ — รันซ้ำจะ error เพราะ unique constraints
 *       ใช้เฉพาะ development / fresh DB เท่านั้น
 */

exports.up = (pgm) => {
  // ─── lookup_options ─────────────────────────────────────────────────────────
  pgm.sql(`
    INSERT INTO lookup_options (category, code, label, extra) VALUES
    -- generations
    ('generation', 'gen-43', 'รุ่น 43', '{"year_start":2011,"year_end":2015}'),
    ('generation', 'gen-46', 'รุ่น 46', '{"year_start":2014,"year_end":2018}'),
    ('generation', 'gen-48', 'รุ่น 48', '{"year_start":2016,"year_end":2020}'),

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
      'admin', 'approved', 0, null, null, false, false, 'alumni', null),

    -- ชุดแรก 4 คน
    ('60010001','hash_60010001','somchai.j@example.edu','สมชาย ใจดี',
      (SELECT id FROM lookup_options WHERE code='gen-43'),
      (SELECT id FROM lookup_options WHERE code='th-bkk'),
      (SELECT id FROM lookup_options WHERE code='career-private'),
      'บริษัท เอบีซี จำกัด','Senior Developer','ดูแลระบบและพัฒนาโปรดักต์ให้ทีมงานภายใน',
      'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=600&q=80',
      'alumni','approved',16,
      (SELECT id FROM lookup_options WHERE code='th-cbi'),
      (SELECT id FROM lookup_options WHERE code='th-bkk'),
      true, true, 'alumni', 2015),

    ('61010045','hash_61010045','somying.r@example.edu','สมหญิง รักเรียน',
      (SELECT id FROM lookup_options WHERE code='gen-46'),
      (SELECT id FROM lookup_options WHERE code='th-cnx'),
      (SELECT id FROM lookup_options WHERE code='career-gov'),
      'โรงพยาบาลนครพิงค์','พยาบาลวิชาชีพ','ดูแลผู้ป่วยในพื้นที่ห่างไกลมากว่า 8 ปี',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
      'alumni','approved',0,
      (SELECT id FROM lookup_options WHERE code='th-cnx'),
      (SELECT id FROM lookup_options WHERE code='th-cnx'),
      true, true, 'alumni', 2018),

    ('60010099','hash_60010099','somsak.m@example.edu','สมศักดิ์ มั่นคง',
      (SELECT id FROM lookup_options WHERE code='gen-43'),
      (SELECT id FROM lookup_options WHERE code='th-bkk'),
      (SELECT id FROM lookup_options WHERE code='career-own'),
      'ร้านกาแฟ Coffee Cool','เจ้าของร้าน','สร้างงานให้คนในชุมชนกว่า 15 ตำแหน่ง',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
      'alumni','approved',0,
      (SELECT id FROM lookup_options WHERE code='th-bkk'),
      (SELECT id FROM lookup_options WHERE code='th-bkk'),
      true, false, 'alumni', 2015),

    ('65010010','hash_65010010','paweena.t@example.edu','ปวีณา ตั้งใจสมัคร',
      (SELECT id FROM lookup_options WHERE code='gen-48'),
      null, null, null, null, null, null,
      'alumni','pending',0,
      (SELECT id FROM lookup_options WHERE code='th-cbi'),
      null, true, false, 'studying', 2027),

    -- ชุด HOF 10 คน
    ('62010021','hash_62010021','wipada.s@example.edu','วิภาดา ศรีสุข',
      (SELECT id FROM lookup_options WHERE code='gen-43'),
      (SELECT id FROM lookup_options WHERE code='th-nma'),
      (SELECT id FROM lookup_options WHERE code='career-gov'),
      'โรงเรียนราชสีมาวิทยาลัย','ครูสอนภาษาอังกฤษ','พัฒนาหลักสูตรภาษาอังกฤษให้เด็กในพื้นที่ห่างไกลกว่า 10 ปี',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      'alumni','approved',9,
      (SELECT id FROM lookup_options WHERE code='th-nma'),
      (SELECT id FROM lookup_options WHERE code='th-nma'),
      true, true, 'alumni', 2015),

    ('62010022','hash_62010022','thanakorn.p@example.edu','ธนากร พงษ์พันธ์',
      (SELECT id FROM lookup_options WHERE code='gen-46'),
      (SELECT id FROM lookup_options WHERE code='th-cbi'),
      (SELECT id FROM lookup_options WHERE code='career-private'),
      'บริษัท ปตท. จำกัด (มหาชน)','วิศวกรปิโตรเลียม','ควบคุมดูแลระบบท่อขนส่งก๊าซธรรมชาติภาคตะวันออก',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      'alumni','approved',7,
      (SELECT id FROM lookup_options WHERE code='th-cbi'),
      (SELECT id FROM lookup_options WHERE code='th-cbi'),
      true, true, 'alumni', 2018),

    ('62010023','hash_62010023','orathai.m@example.edu','อรทัย มีสุข',
      (SELECT id FROM lookup_options WHERE code='gen-48'),
      (SELECT id FROM lookup_options WHERE code='th-cnx'),
      (SELECT id FROM lookup_options WHERE code='career-freelance'),
      'อิสระ','นักออกแบบกราฟิก','ออกแบบแบรนด์ให้ธุรกิจ SME ในภาคเหนือกว่า 50 ราย',
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80',
      'alumni','approved',5,
      (SELECT id FROM lookup_options WHERE code='th-cnx'),
      (SELECT id FROM lookup_options WHERE code='th-cnx'),
      true, true, 'alumni', 2020),

    ('62010024','hash_62010024','prasert.y@example.edu','ประเสริฐ ยิ้มแย้ม',
      (SELECT id FROM lookup_options WHERE code='gen-43'),
      (SELECT id FROM lookup_options WHERE code='th-bkk'),
      (SELECT id FROM lookup_options WHERE code='career-private'),
      'สำนักงานกฎหมาย ยิ้มแย้ม แอนด์ พาร์ทเนอร์ส','ทนายความอาวุโส','ให้คำปรึกษากฎหมายฟรีแก่ศิษย์เก่าที่เดือดร้อนมากว่า 12 ปี',
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
      'alumni','approved',14,
      (SELECT id FROM lookup_options WHERE code='th-bkk'),
      (SELECT id FROM lookup_options WHERE code='th-bkk'),
      true, true, 'alumni', 2015),

    ('62010025','hash_62010025','kamonchanok.s@example.edu','กมลชนก แสงทอง',
      (SELECT id FROM lookup_options WHERE code='gen-46'),
      (SELECT id FROM lookup_options WHERE code='th-bkk'),
      (SELECT id FROM lookup_options WHERE code='career-private'),
      'สถานีข่าวไทยพีบีเอส','ผู้สื่อข่าวสายสิ่งแวดล้อม','รายงานข่าวเชิงลึกด้านสิ่งแวดล้อมที่ได้รับรางวัลระดับประเทศ',
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80',
      'alumni','approved',4,
      (SELECT id FROM lookup_options WHERE code='th-bkk'),
      (SELECT id FROM lookup_options WHERE code='th-bkk'),
      true, true, 'alumni', 2018),

    ('62010026','hash_62010026','chaiwat.r@example.edu','ชัยวัฒน์ รุ่งเรือง',
      (SELECT id FROM lookup_options WHERE code='gen-48'),
      (SELECT id FROM lookup_options WHERE code='th-phk'),
      (SELECT id FROM lookup_options WHERE code='career-own'),
      'ร้านอาหาร Rung Ruang Kitchen','เชฟเจ้าของร้าน','ร้านอาหารได้รับดาวมิชลินไกด์ 2 ปีซ้อน สร้างงานให้คนในพื้นที่กว่า 30 ตำแหน่ง',
      'https://images.unsplash.com/photo-1583195764036-6dc248ac07d9?auto=format&fit=crop&w=400&q=80',
      'alumni','approved',18,
      (SELECT id FROM lookup_options WHERE code='th-phk'),
      (SELECT id FROM lookup_options WHERE code='th-phk'),
      true, true, 'alumni', 2020),

    ('62010027','hash_62010027','napassorn.j@example.edu','นภัสสร ใจงาม',
      (SELECT id FROM lookup_options WHERE code='gen-43'),
      (SELECT id FROM lookup_options WHERE code='th-kkc'),
      (SELECT id FROM lookup_options WHERE code='career-private'),
      'บริษัท ใจงาม สถาปนิก จำกัด','สถาปนิกอาวุโส','ออกแบบอาคารประหยัดพลังงานให้หน่วยงานราชการในภาคอีสาน',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      'alumni','approved',6,
      (SELECT id FROM lookup_options WHERE code='th-kkc'),
      (SELECT id FROM lookup_options WHERE code='th-kkc'),
      true, true, 'alumni', 2015),

    ('62010028','hash_62010028','piyapong.p@example.edu','ปิยะพงษ์ เพชรดี',
      (SELECT id FROM lookup_options WHERE code='gen-46'),
      (SELECT id FROM lookup_options WHERE code='th-bkk'),
      (SELECT id FROM lookup_options WHERE code='career-private'),
      'บริษัท Petch Games Studio','ผู้ก่อตั้งและนักพัฒนาเกม','พัฒนาเกมมือถือที่มียอดดาวน์โหลดกว่า 2 ล้านครั้งทั่วโลก',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
      'alumni','approved',8,
      (SELECT id FROM lookup_options WHERE code='th-bkk'),
      (SELECT id FROM lookup_options WHERE code='th-bkk'),
      true, true, 'alumni', 2018),

    ('62010029','hash_62010029','sunisa.t@example.edu','สุนิสา ทองแท้',
      (SELECT id FROM lookup_options WHERE code='gen-48'),
      (SELECT id FROM lookup_options WHERE code='th-sni'),
      (SELECT id FROM lookup_options WHERE code='career-own'),
      'สวนผลไม้ทองแท้ ออร์แกนิค','เจ้าของธุรกิจเกษตรอินทรีย์','ส่งออกผลไม้อินทรีย์ไปยัง 5 ประเทศ สร้างรายได้ให้เกษตรกรในพื้นที่',
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=80',
      'alumni','approved',11,
      (SELECT id FROM lookup_options WHERE code='th-sni'),
      (SELECT id FROM lookup_options WHERE code='th-sni'),
      true, true, 'alumni', 2020),

    ('62010030','hash_62010030','anucha.s@example.edu','อนุชา ศักดิ์สิทธิ์',
      (SELECT id FROM lookup_options WHERE code='gen-43'),
      (SELECT id FROM lookup_options WHERE code='th-nkp'),
      (SELECT id FROM lookup_options WHERE code='career-gov'),
      'สมาคมกีฬาแห่งประเทศไทย','อดีตนักกีฬาทีมชาติ','เหรียญทองซีเกมส์ 2 สมัย ปัจจุบันเป็นผู้ฝึกสอนเยาวชน',
      'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=400&q=80',
      'alumni','approved',2,
      (SELECT id FROM lookup_options WHERE code='th-nkp'),
      (SELECT id FROM lookup_options WHERE code='th-nkp'),
      true, false, 'alumni', 2015);
  `);

  // ─── user_verifications ─────────────────────────────────────────────────────
  pgm.sql(`
    INSERT INTO user_verifications (user_id, admin_id, source, status, remark) VALUES
    ((SELECT id FROM users WHERE student_id='60010001'), 1, 'admin_manual', 'approved', 'ตรวจสอบรหัสนักศึกษาแล้วตรงกับข้อมูลจบการศึกษา'),
    ((SELECT id FROM users WHERE student_id='60010001'), null, 'registrar_api', 'matched', 'ผลตรวจสอบจากสำนักทะเบียนตรงกัน'),
    ((SELECT id FROM users WHERE student_id='65010010'), 1, 'admin_manual', 'pending', null);
  `);

  // ─── posts ──────────────────────────────────────────────────────────────────
  pgm.sql(`
    INSERT INTO posts (admin_id, category, title, content, post_type, status, pinned, published_at) VALUES
    (1, 'ประกาศกิจกรรม', 'ขอเชิญร่วมงานคืนสู่เหย้าประจำปี 2569',
     'พบกันวันที่ 20 ธันวาคมนี้ ที่ Grand Hall กรุงเทพฯ ร่วมงานเลี้ยงรุ่นและมอบรางวัลศิษย์เก่าดีเด่นประจำปี',
     'normal', 'published', true, now()),
    (1, 'โพลสำรวจความเห็น', 'อยากได้ธีมงานคืนสู่เหย้าแบบไหน?',
     'ร่วมโหวตธีมงานปีนี้ ได้คะแนนสะสมทันทีที่โหวต',
     'poll', 'published', false, now());

    INSERT INTO posts (admin_id, requested_by, category, title, content, post_type, status, pinned) VALUES
    (null,
     (SELECT id FROM users WHERE student_id='60010001'),
     'ขอความช่วยเหลือ', 'ขอเชิญร่วมบริจาคหนังสือให้ห้องสมุด',
     'อยากชวนศิษย์เก่าร่วมกันบริจาคหนังสือให้รุ่นน้อง รบกวนแอดมินช่วยเผยแพร่ให้ด้วยครับ',
     'normal', 'pending_request', false);
  `);

  // ─── post_interactions ──────────────────────────────────────────────────────
  pgm.sql(`
    INSERT INTO post_interactions (post_id, user_id, type, content, points_earned) VALUES
    ((SELECT id FROM posts WHERE title LIKE 'ขอเชิญร่วมงาน%'),
     (SELECT id FROM users WHERE student_id='60010001'),
     'comment', 'รอมางานนี้เลยครับ ปีนี้ไม่พลาด!', 1);

    INSERT INTO post_interactions (post_id, user_id, type, emoji_option_id) VALUES
    ((SELECT id FROM posts WHERE title LIKE 'ขอเชิญร่วมงาน%'),
     (SELECT id FROM users WHERE student_id='61010045'),
     'reaction', (SELECT id FROM lookup_options WHERE code='love'));
  `);

  // ─── polls + options + votes ─────────────────────────────────────────────────
  pgm.sql(`
    INSERT INTO polls (post_id, question, points_per_vote, status) VALUES
    ((SELECT id FROM posts WHERE title LIKE 'อยากได้ธีมงาน%'), 'เลือกธีมงานคืนสู่เหย้า', 5, 'active');

    INSERT INTO poll_options (poll_id, option_text) VALUES
    ((SELECT id FROM polls LIMIT 1), 'ธีมย้อนยุค (Retro)'),
    ((SELECT id FROM polls LIMIT 1), 'ธีมทะเล (Beach Party)');

    INSERT INTO poll_votes (poll_id, option_id, user_id, points_awarded) VALUES
    ((SELECT id FROM polls LIMIT 1),
     (SELECT id FROM poll_options WHERE option_text LIKE 'ธีมย้อนยุค%'),
     (SELECT id FROM users WHERE student_id='60010001'), 5),
    ((SELECT id FROM polls LIMIT 1),
     (SELECT id FROM poll_options WHERE option_text LIKE 'ธีมทะเล%'),
     (SELECT id FROM users WHERE student_id='61010045'), 5);
  `);

  // ─── Hall of Fame ────────────────────────────────────────────────────────────
  pgm.sql(`
    INSERT INTO hof_campaigns (title, status) VALUES ('ศิษย์เก่าดีเด่นประจำปี 2569', 'open');

    INSERT INTO hof_candidates (campaign_id, user_id, description) VALUES
    ((SELECT id FROM hof_campaigns LIMIT 1), (SELECT id FROM users WHERE student_id='60010001'), 'พัฒนาแพลตฟอร์มศิษย์เก่าให้มหาวิทยาลัยฟรี'),
    ((SELECT id FROM hof_campaigns LIMIT 1), (SELECT id FROM users WHERE student_id='61010045'), 'ดูแลผู้ป่วยในพื้นที่ห่างไกลมากว่า 8 ปี'),
    ((SELECT id FROM hof_campaigns LIMIT 1), (SELECT id FROM users WHERE student_id='60010099'), 'สร้างงานให้คนในชุมชนกว่า 15 ตำแหน่ง'),
    ((SELECT id FROM hof_campaigns LIMIT 1), (SELECT id FROM users WHERE student_id='62010021'), 'พัฒนาหลักสูตรภาษาอังกฤษให้เด็กในพื้นที่ห่างไกลกว่า 10 ปี'),
    ((SELECT id FROM hof_campaigns LIMIT 1), (SELECT id FROM users WHERE student_id='62010022'), 'ควบคุมดูแลระบบท่อขนส่งก๊าซธรรมชาติภาคตะวันออก'),
    ((SELECT id FROM hof_campaigns LIMIT 1), (SELECT id FROM users WHERE student_id='62010023'), 'ออกแบบแบรนด์ให้ธุรกิจ SME ในภาคเหนือกว่า 50 ราย'),
    ((SELECT id FROM hof_campaigns LIMIT 1), (SELECT id FROM users WHERE student_id='62010024'), 'ให้คำปรึกษากฎหมายฟรีแก่ศิษย์เก่าที่เดือดร้อนมากว่า 12 ปี'),
    ((SELECT id FROM hof_campaigns LIMIT 1), (SELECT id FROM users WHERE student_id='62010025'), 'รายงานข่าวเชิงลึกด้านสิ่งแวดล้อมที่ได้รับรางวัลระดับประเทศ'),
    ((SELECT id FROM hof_campaigns LIMIT 1), (SELECT id FROM users WHERE student_id='62010026'), 'ร้านอาหารได้รับดาวมิชลินไกด์ 2 ปีซ้อน สร้างงานให้คนในพื้นที่กว่า 30 ตำแหน่ง'),
    ((SELECT id FROM hof_campaigns LIMIT 1), (SELECT id FROM users WHERE student_id='62010027'), 'ออกแบบอาคารประหยัดพลังงานให้หน่วยงานราชการในภาคอีสาน'),
    ((SELECT id FROM hof_campaigns LIMIT 1), (SELECT id FROM users WHERE student_id='62010028'), 'พัฒนาเกมมือถือที่มียอดดาวน์โหลดกว่า 2 ล้านครั้งทั่วโลก'),
    ((SELECT id FROM hof_campaigns LIMIT 1), (SELECT id FROM users WHERE student_id='62010029'), 'ส่งออกผลไม้อินทรีย์ไปยัง 5 ประเทศ สร้างรายได้ให้เกษตรกรในพื้นที่'),
    ((SELECT id FROM hof_campaigns LIMIT 1), (SELECT id FROM users WHERE student_id='62010030'), 'เหรียญทองซีเกมส์ 2 สมัย ปัจจุบันเป็นผู้ฝึกสอนเยาวชน');
  `);

  pgm.sql(`
    INSERT INTO hof_votes (campaign_id, voter_id, candidate_id, vote_category, points) VALUES
    -- ชุดแรก (60x - 61x)
    ((SELECT id FROM hof_campaigns LIMIT 1),
     (SELECT id FROM users WHERE student_id='60010001'),
     (SELECT id FROM hof_candidates WHERE user_id=(SELECT id FROM users WHERE student_id='60010099')),
     'same_generation', 5),
    ((SELECT id FROM hof_campaigns LIMIT 1),
     (SELECT id FROM users WHERE student_id='60010001'),
     (SELECT id FROM hof_candidates WHERE user_id=(SELECT id FROM users WHERE student_id='61010045')),
     'other_generation', 10),
    ((SELECT id FROM hof_campaigns LIMIT 1),
     (SELECT id FROM users WHERE student_id='60010099'),
     (SELECT id FROM hof_candidates WHERE user_id=(SELECT id FROM users WHERE student_id='61010045')),
     'other_generation', 10),
    ((SELECT id FROM hof_campaigns LIMIT 1),
     (SELECT id FROM users WHERE student_id='61010045'),
     (SELECT id FROM hof_candidates WHERE user_id=(SELECT id FROM users WHERE student_id='60010001')),
     'other_generation', 10),

    -- ชุด HOF 10 คน
    ((SELECT id FROM hof_campaigns LIMIT 1),
     (SELECT id FROM users WHERE student_id='62010021'),
     (SELECT id FROM hof_candidates WHERE user_id=(SELECT id FROM users WHERE student_id='62010026')),
     'other_generation', 10),
    ((SELECT id FROM hof_campaigns LIMIT 1),
     (SELECT id FROM users WHERE student_id='62010021'),
     (SELECT id FROM hof_candidates WHERE user_id=(SELECT id FROM users WHERE student_id='62010024')),
     'same_generation', 5),

    ((SELECT id FROM hof_campaigns LIMIT 1),
     (SELECT id FROM users WHERE student_id='62010022'),
     (SELECT id FROM hof_candidates WHERE user_id=(SELECT id FROM users WHERE student_id='62010026')),
     'other_generation', 10),
    ((SELECT id FROM hof_campaigns LIMIT 1),
     (SELECT id FROM users WHERE student_id='62010022'),
     (SELECT id FROM hof_candidates WHERE user_id=(SELECT id FROM users WHERE student_id='62010025')),
     'same_generation', 5),

    ((SELECT id FROM hof_campaigns LIMIT 1),
     (SELECT id FROM users WHERE student_id='62010023'),
     (SELECT id FROM hof_candidates WHERE user_id=(SELECT id FROM users WHERE student_id='62010024')),
     'other_generation', 10),
    ((SELECT id FROM hof_campaigns LIMIT 1),
     (SELECT id FROM users WHERE student_id='62010023'),
     (SELECT id FROM hof_candidates WHERE user_id=(SELECT id FROM users WHERE student_id='62010029')),
     'same_generation', 5),

    ((SELECT id FROM hof_campaigns LIMIT 1),
     (SELECT id FROM users WHERE student_id='62010024'),
     (SELECT id FROM hof_candidates WHERE user_id=(SELECT id FROM users WHERE student_id='62010021')),
     'other_generation', 10),
    ((SELECT id FROM hof_campaigns LIMIT 1),
     (SELECT id FROM users WHERE student_id='62010024'),
     (SELECT id FROM hof_candidates WHERE user_id=(SELECT id FROM users WHERE student_id='62010027')),
     'same_generation', 5),

    ((SELECT id FROM hof_campaigns LIMIT 1),
     (SELECT id FROM users WHERE student_id='62010025'),
     (SELECT id FROM hof_candidates WHERE user_id=(SELECT id FROM users WHERE student_id='62010024')),
     'other_generation', 10),
    ((SELECT id FROM hof_campaigns LIMIT 1),
     (SELECT id FROM users WHERE student_id='62010025'),
     (SELECT id FROM hof_candidates WHERE user_id=(SELECT id FROM users WHERE student_id='62010022')),
     'same_generation', 5),

    ((SELECT id FROM hof_campaigns LIMIT 1),
     (SELECT id FROM users WHERE student_id='62010026'),
     (SELECT id FROM hof_candidates WHERE user_id=(SELECT id FROM users WHERE student_id='62010021')),
     'other_generation', 10),
    ((SELECT id FROM hof_campaigns LIMIT 1),
     (SELECT id FROM users WHERE student_id='62010026'),
     (SELECT id FROM hof_candidates WHERE user_id=(SELECT id FROM users WHERE student_id='62010025')),
     'same_generation', 5),

    ((SELECT id FROM hof_campaigns LIMIT 1),
     (SELECT id FROM users WHERE student_id='62010027'),
     (SELECT id FROM hof_candidates WHERE user_id=(SELECT id FROM users WHERE student_id='62010022')),
     'other_generation', 10),

    ((SELECT id FROM hof_campaigns LIMIT 1),
     (SELECT id FROM users WHERE student_id='62010028'),
     (SELECT id FROM hof_candidates WHERE user_id=(SELECT id FROM users WHERE student_id='62010023')),
     'other_generation', 10),

    ((SELECT id FROM hof_campaigns LIMIT 1),
     (SELECT id FROM users WHERE student_id='62010029'),
     (SELECT id FROM hof_candidates WHERE user_id=(SELECT id FROM users WHERE student_id='62010026')),
     'other_generation', 10),

    ((SELECT id FROM hof_campaigns LIMIT 1),
     (SELECT id FROM users WHERE student_id='62010030'),
     (SELECT id FROM hof_candidates WHERE user_id=(SELECT id FROM users WHERE student_id='62010028')),
     'other_generation', 10);
  `);

  // ─── media_assets + photo_tags + photo_view_verifications ────────────────────
  pgm.sql(`
    INSERT INTO media_assets (owner_type, owner_id, generation_option_id, uploaded_by, image_url, watermark_url, caption) VALUES
    ('user_gallery',
     (SELECT id FROM users WHERE student_id='60010001'), null,
     (SELECT id FROM users WHERE student_id='60010001'),
     'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=400&q=60',
     null, 'งานรับปริญญา 2558'),
    ('user_gallery',
     (SELECT id FROM users WHERE student_id='60010001'), null,
     (SELECT id FROM users WHERE student_id='60010001'),
     'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=400&q=60',
     null, 'ทริปเพื่อนกลุ่ม IT'),
    ('photo_archive', null,
     (SELECT id FROM lookup_options WHERE code='gen-43'), 1,
     'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=700&q=60',
     'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80',
     'พิธีรับปริญญา รุ่น 43'),
    ('photo_archive', null,
     (SELECT id FROM lookup_options WHERE code='gen-46'), 1,
     'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=700&q=60',
     'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=900&q=80',
     'ทริปเพื่อนกลุ่ม IT รุ่น 46');

    INSERT INTO photo_tags (asset_id, tagged_user_id, tagged_by, tag_source) VALUES
    ((SELECT id FROM media_assets WHERE caption='พิธีรับปริญญา รุ่น 43'),
     (SELECT id FROM users WHERE student_id='60010001'), 1, 'manual'),
    ((SELECT id FROM media_assets WHERE caption='พิธีรับปริญญา รุ่น 43'),
     (SELECT id FROM users WHERE student_id='60010099'), 1, 'ai');

    INSERT INTO photo_view_verifications (asset_id, user_id, question, is_passed, points_earned) VALUES
    ((SELECT id FROM media_assets WHERE caption='พิธีรับปริญญา รุ่น 43'),
     (SELECT id FROM users WHERE student_id='61010045'),
     'อาจารย์ที่ปรึกษาของรุ่นนี้ชื่ออะไร?', true, 5);
  `);
};

exports.down = (pgm) => {
  // ลบ seed data ในลำดับย้อนกลับตาม FK dependencies
  pgm.sql(`
    DELETE FROM photo_view_verifications;
    DELETE FROM photo_tags;
    DELETE FROM media_assets;
    DELETE FROM hof_votes;
    DELETE FROM hof_candidates;
    DELETE FROM hof_campaigns;
    DELETE FROM poll_votes;
    DELETE FROM poll_options;
    DELETE FROM polls;
    DELETE FROM post_interactions;
    DELETE FROM posts;
    DELETE FROM user_verifications;
    DELETE FROM users;
    DELETE FROM lookup_options;
  `);
};
