-- ============================================================
-- Alumni System — schema แบบกระชับ (14 ตาราง) + seed data จำลอง
-- รันอัตโนมัติตอน container ของ Postgres สร้างครั้งแรก (docker-compose)
-- ============================================================

-- 1) lookup_options: รวม generations / provinces / career_types / emoji_types
create table lookup_options (
  id            serial primary key,
  category      text not null,               -- generation | province | career_type | emoji
  code          text not null,
  label         text not null,
  extra         jsonb default '{}'::jsonb     -- เช่น {"year_start":2011,"year_end":2015} หรือ {"region":"เหนือ","metro":true}
);

-- 2) users: ศิษย์เก่า + admin รวมตารางเดียว
create table users (
  id                  serial primary key,
  student_id          text unique,
  citizen_id_hash     text,
  email               text unique,
  name                text not null,
  generation_option_id int references lookup_options(id),
  province_option_id  int references lookup_options(id),
  career_option_id    int references lookup_options(id),
  company             text,
  position            text,
  bio                 text,
  avatar_url          text,
  role                text not null default 'alumni',   -- alumni | admin
  status              text not null default 'pending',  -- pending | approved | rejected
  total_points        int not null default 0,
  hometown_province_id     int references lookup_options(id),
  work_province_id         int references lookup_options(id),
  show_hometown_on_map     boolean not null default false,
  show_workplace_on_map    boolean not null default false,
  student_status            text not null default 'studying'
    check (student_status in ('studying', 'alumni')),
  expected_graduation_year  integer,
  created_at          timestamptz not null default now()
);

-- Admin ได้แค่ 1 คนเท่านั้นในระบบ
create unique index one_admin_only on users ((true)) where role = 'admin';

-- 3) user_verifications: รวม registration_approvals + registrar_api_verifications
create table user_verifications (
  id            serial primary key,
  user_id       int references users(id),
  admin_id      int references users(id),
  source        text not null,     -- admin_manual | registrar_api
  status        text not null,     -- approved | rejected | pending | matched | not_found
  remark        text,
  decided_at    timestamptz default now()
);

-- 4) media_assets: รวม post_images + user_gallery_images + photo_archive_images(+albums)
create table media_assets (
  id                    serial primary key,
  owner_type            text not null,   -- post | user_gallery | photo_archive
  owner_id              int,             -- ชี้ไปที่ posts.id หรือ users.id ตาม owner_type (เช็คที่ฝั่งแอป)
  generation_option_id  int references lookup_options(id), -- ใช้เฉพาะ owner_type = photo_archive
  uploaded_by           int references users(id),
  image_url             text not null,
  watermark_url         text,
  caption               text,
  sort_order            int default 0,
  created_at            timestamptz not null default now()
);

-- 5) posts (เพิ่ม requested_by / status / published_at สำหรับระบบ "ร้องขอโพสต์")
create table posts (
  id            serial primary key,
  admin_id      int references users(id),
  requested_by  int references users(id),
  category      text,
  title         text not null,
  content       text,
  post_type     text not null default 'normal', -- normal | poll
  status        text not null default 'published'
    check (status in ('pending_request', 'published', 'rejected')),
  pinned        boolean default false,
  published_at  timestamptz,
  created_at    timestamptz not null default now()
);

-- 6) post_interactions: รวม comments + reactions
create table post_interactions (
  id                serial primary key,
  post_id           int references posts(id),
  user_id           int references users(id),
  type              text not null,     -- comment | reaction
  content           text,
  emoji_option_id   int references lookup_options(id),
  points_earned     int default 0,
  created_at        timestamptz not null default now()
);

-- 7) polls
create table polls (
  id                serial primary key,
  post_id           int unique references posts(id),
  question          text not null,
  points_per_vote   int not null default 0,
  status            text not null default 'active'
);

-- 8) poll_options
create table poll_options (
  id        serial primary key,
  poll_id   int references polls(id),
  option_text text not null
);

-- 9) poll_votes
create table poll_votes (
  id                serial primary key,
  poll_id           int references polls(id),
  option_id         int references poll_options(id),
  user_id           int references users(id),
  points_awarded    int not null default 0,
  voted_at          timestamptz not null default now(),
  unique (poll_id, user_id)
);

-- 10) hof_campaigns
create table hof_campaigns (
  id        serial primary key,
  title     text not null,
  status    text not null default 'open'
);

-- 11) hof_candidates
create table hof_candidates (
  id            serial primary key,
  campaign_id   int references hof_campaigns(id),
  user_id       int references users(id),
  description   text
);

-- 12) hof_votes  (same_generation = 5 คะแนน, other_generation = 10 คะแนน)
create table hof_votes (
  id              serial primary key,
  campaign_id     int references hof_campaigns(id),
  voter_id        int references users(id),
  candidate_id    int references hof_candidates(id),
  vote_category   text not null,  -- same_generation | other_generation
  points          int not null,
  voted_at        timestamptz not null default now(),
  unique (campaign_id, voter_id, vote_category)
);

-- 13) photo_tags (เพิ่ม unique constraint กันแท็กซ้ำคนเดิมในรูปเดิม)
create table photo_tags (
  id                serial primary key,
  asset_id          int references media_assets(id),
  tagged_user_id    int references users(id),
  tagged_by         int references users(id),
  tag_source        text not null default 'manual', -- manual | ai
  unique (asset_id, tagged_user_id)
);

-- 14) photo_view_verifications (ตอบถูก = ปลดล็อกรูป + ได้คะแนน)
create table photo_view_verifications (
  id              serial primary key,
  asset_id        int references media_assets(id),
  user_id         int references users(id),
  question        text,
  is_passed       boolean default false,
  points_earned   int default 0,
  verified_at     timestamptz default now()
);

-- ============================================================
-- SEED DATA จำลอง
-- ============================================================

insert into lookup_options (category, code, label, extra) values
('generation', 'gen-43', 'รุ่น 43', '{"year_start":2011,"year_end":2015}'),
('generation', 'gen-46', 'รุ่น 46', '{"year_start":2014,"year_end":2018}'),
('generation', 'gen-48', 'รุ่น 48', '{"year_start":2016,"year_end":2020}'),

-- ===== จังหวัดครบ 77 จังหวัด (region = ภาค, metro = อยู่ในกลุ่มกรุงเทพและปริมณฑลหรือไม่) =====
-- ภาคกลาง
('province', 'th-bkk', 'กรุงเทพมหานคร', '{"region":"กลาง","metro":true}'),
('province', 'th-nnt', 'นนทบุรี', '{"region":"กลาง","metro":true}'),
('province', 'th-ptt', 'ปทุมธานี', '{"region":"กลาง","metro":true}'),
('province', 'th-skp', 'สมุทรปราการ', '{"region":"กลาง","metro":true}'),
('province', 'th-sks', 'สมุทรสาคร', '{"region":"กลาง","metro":true}'),
('province', 'th-nkp', 'นครปฐม', '{"region":"กลาง","metro":true}'),
('province', 'th-sksg', 'สมุทรสงคราม', '{"region":"กลาง","metro":false}'),
('province', 'th-ayt', 'พระนครศรีอยุธยา', '{"region":"กลาง","metro":false}'),
('province', 'th-agt', 'อ่างทอง', '{"region":"กลาง","metro":false}'),
('province', 'th-lpb', 'ลพบุรี', '{"region":"กลาง","metro":false}'),
('province', 'th-sib', 'สิงห์บุรี', '{"region":"กลาง","metro":false}'),
('province', 'th-cnt', 'ชัยนาท', '{"region":"กลาง","metro":false}'),
('province', 'th-sbr', 'สระบุรี', '{"region":"กลาง","metro":false}'),
('province', 'th-nyk', 'นครนายก', '{"region":"กลาง","metro":false}'),
('province', 'th-spb', 'สุพรรณบุรี', '{"region":"กลาง","metro":false}'),
('province', 'th-uti', 'อุทัยธานี', '{"region":"กลาง","metro":false}'),
('province', 'th-nsw', 'นครสวรรค์', '{"region":"กลาง","metro":false}'),

-- ภาคเหนือ
('province', 'th-cnx', 'เชียงใหม่', '{"region":"เหนือ","metro":false}'),
('province', 'th-crn', 'เชียงราย', '{"region":"เหนือ","metro":false}'),
('province', 'th-lpn', 'ลำปาง', '{"region":"เหนือ","metro":false}'),
('province', 'th-lph', 'ลำพูน', '{"region":"เหนือ","metro":false}'),
('province', 'th-msn', 'แม่ฮ่องสอน', '{"region":"เหนือ","metro":false}'),
('province', 'th-nan', 'น่าน', '{"region":"เหนือ","metro":false}'),
('province', 'th-pyo', 'พะเยา', '{"region":"เหนือ","metro":false}'),
('province', 'th-pre', 'แพร่', '{"region":"เหนือ","metro":false}'),
('province', 'th-utd', 'อุตรดิตถ์', '{"region":"เหนือ","metro":false}'),
('province', 'th-tak', 'ตาก', '{"region":"เหนือ","metro":false}'),
('province', 'th-skt', 'สุโขทัย', '{"region":"เหนือ","metro":false}'),
('province', 'th-pls', 'พิษณุโลก', '{"region":"เหนือ","metro":false}'),
('province', 'th-pcb', 'พิจิตร', '{"region":"เหนือ","metro":false}'),
('province', 'th-kpp', 'กำแพงเพชร', '{"region":"เหนือ","metro":false}'),
('province', 'th-pnb', 'เพชรบูรณ์', '{"region":"เหนือ","metro":false}'),

-- ภาคอีสาน
('province', 'th-nma', 'นครราชสีมา', '{"region":"อีสาน","metro":false}'),
('province', 'th-brm', 'บุรีรัมย์', '{"region":"อีสาน","metro":false}'),
('province', 'th-srn', 'สุรินทร์', '{"region":"อีสาน","metro":false}'),
('province', 'th-ssk', 'ศรีสะเกษ', '{"region":"อีสาน","metro":false}'),
('province', 'th-ubn', 'อุบลราชธานี', '{"region":"อีสาน","metro":false}'),
('province', 'th-yso', 'ยโสธร', '{"region":"อีสาน","metro":false}'),
('province', 'th-cpm', 'ชัยภูมิ', '{"region":"อีสาน","metro":false}'),
('province', 'th-amc', 'อำนาจเจริญ', '{"region":"อีสาน","metro":false}'),
('province', 'th-nbl', 'หนองบัวลำภู', '{"region":"อีสาน","metro":false}'),
('province', 'th-kkc', 'ขอนแก่น', '{"region":"อีสาน","metro":false}'),
('province', 'th-udt', 'อุดรธานี', '{"region":"อีสาน","metro":false}'),
('province', 'th-loe', 'เลย', '{"region":"อีสาน","metro":false}'),
('province', 'th-nkh', 'หนองคาย', '{"region":"อีสาน","metro":false}'),
('province', 'th-msk', 'มหาสารคาม', '{"region":"อีสาน","metro":false}'),
('province', 'th-ret', 'ร้อยเอ็ด', '{"region":"อีสาน","metro":false}'),
('province', 'th-kls', 'กาฬสินธุ์', '{"region":"อีสาน","metro":false}'),
('province', 'th-skn', 'สกลนคร', '{"region":"อีสาน","metro":false}'),
('province', 'th-nph', 'นครพนม', '{"region":"อีสาน","metro":false}'),
('province', 'th-mdh', 'มุกดาหาร', '{"region":"อีสาน","metro":false}'),
('province', 'th-bkn', 'บึงกาฬ', '{"region":"อีสาน","metro":false}'),

-- ภาคตะวันออก
('province', 'th-cbi', 'ชลบุรี', '{"region":"ตะวันออก","metro":false}'),
('province', 'th-ryg', 'ระยอง', '{"region":"ตะวันออก","metro":false}'),
('province', 'th-cnb', 'จันทบุรี', '{"region":"ตะวันออก","metro":false}'),
('province', 'th-trt', 'ตราด', '{"region":"ตะวันออก","metro":false}'),
('province', 'th-cch', 'ฉะเชิงเทรา', '{"region":"ตะวันออก","metro":false}'),
('province', 'th-prc', 'ปราจีนบุรี', '{"region":"ตะวันออก","metro":false}'),
('province', 'th-skw', 'สระแก้ว', '{"region":"ตะวันออก","metro":false}'),

-- ภาคตะวันตก
('province', 'th-knb', 'กาญจนบุรี', '{"region":"ตะวันตก","metro":false}'),
('province', 'th-rbr', 'ราชบุรี', '{"region":"ตะวันตก","metro":false}'),
('province', 'th-pbi', 'เพชรบุรี', '{"region":"ตะวันตก","metro":false}'),
('province', 'th-pkk', 'ประจวบคีรีขันธ์', '{"region":"ตะวันตก","metro":false}'),

-- ภาคใต้
('province', 'th-nst', 'นครศรีธรรมราช', '{"region":"ใต้","metro":false}'),
('province', 'th-kbi', 'กระบี่', '{"region":"ใต้","metro":false}'),
('province', 'th-pna', 'พังงา', '{"region":"ใต้","metro":false}'),
('province', 'th-phk', 'ภูเก็ต', '{"region":"ใต้","metro":false}'),
('province', 'th-sni', 'สุราษฎร์ธานี', '{"region":"ใต้","metro":false}'),
('province', 'th-rng', 'ระนอง', '{"region":"ใต้","metro":false}'),
('province', 'th-cpn', 'ชุมพร', '{"region":"ใต้","metro":false}'),
('province', 'th-skl', 'สงขลา', '{"region":"ใต้","metro":false}'),
('province', 'th-stn', 'สตูล', '{"region":"ใต้","metro":false}'),
('province', 'th-trg', 'ตรัง', '{"region":"ใต้","metro":false}'),
('province', 'th-plg', 'พัทลุง', '{"region":"ใต้","metro":false}'),
('province', 'th-ptn', 'ปัตตานี', '{"region":"ใต้","metro":false}'),
('province', 'th-yla', 'ยะลา', '{"region":"ใต้","metro":false}'),
('province', 'th-nrt', 'นราธิวาส', '{"region":"ใต้","metro":false}'),

('career_type', 'career-gov', 'ราชการ', '{}'),
('career_type', 'career-private', 'เอกชน', '{}'),
('career_type', 'career-own', 'ธุรกิจส่วนตัว', '{}'),
('career_type', 'career-freelance', 'ฟรีแลนซ์', '{}'),
('emoji', 'like', '👍 ถูกใจ', '{}'),
('emoji', 'love', '❤️ รักเลย', '{}');

-- users (id 1 = admin)
insert into users (student_id, citizen_id_hash, email, name, generation_option_id, province_option_id, career_option_id, company, position, bio, avatar_url, role, status, total_points, hometown_province_id, work_province_id, show_hometown_on_map, show_workplace_on_map, student_status, expected_graduation_year) values
(null, null, 'admin@uni.ac.th', 'ผู้ดูแลระบบ', null, null, null, null, null, null, null, 'admin', 'approved', 0, null, null, false, false, 'alumni', null),
('60010001', 'hash_60010001', 'somchai.j@example.edu', 'สมชาย ใจดี',
  (select id from lookup_options where code='gen-43'), (select id from lookup_options where code='th-bkk'), (select id from lookup_options where code='career-private'),
  'บริษัท เอบีซี จำกัด', 'Senior Developer', 'ดูแลระบบและพัฒนาโปรดักต์ให้ทีมงานภายใน',
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=600&q=80', 'alumni', 'approved', 16,
  (select id from lookup_options where code='th-cbi'), (select id from lookup_options where code='th-bkk'), true, true, 'alumni', 2015),
('61010045', 'hash_61010045', 'somying.r@example.edu', 'สมหญิง รักเรียน',
  (select id from lookup_options where code='gen-46'), (select id from lookup_options where code='th-cnx'), (select id from lookup_options where code='career-gov'),
  'โรงพยาบาลนครพิงค์', 'พยาบาลวิชาชีพ', 'ดูแลผู้ป่วยในพื้นที่ห่างไกลมากว่า 8 ปี',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80', 'alumni', 'approved', 0,
  (select id from lookup_options where code='th-cnx'), (select id from lookup_options where code='th-cnx'), true, true, 'alumni', 2018),
('60010099', 'hash_60010099', 'somsak.m@example.edu', 'สมศักดิ์ มั่นคง',
  (select id from lookup_options where code='gen-43'), (select id from lookup_options where code='th-bkk'), (select id from lookup_options where code='career-own'),
  'ร้านกาแฟ Coffee Cool', 'เจ้าของร้าน', 'สร้างงานให้คนในชุมชนกว่า 15 ตำแหน่ง',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80', 'alumni', 'approved', 0,
  (select id from lookup_options where code='th-bkk'), (select id from lookup_options where code='th-bkk'), true, false, 'alumni', 2015),
('65010010', 'hash_65010010', 'paweena.t@example.edu', 'ปวีณา ตั้งใจสมัคร',
  (select id from lookup_options where code='gen-48'), null, null, null, null, null, null, 'alumni', 'pending', 0,
  (select id from lookup_options where code='th-cbi'), null, true, false, 'studying', 2027);

-- user_verifications
insert into user_verifications (user_id, admin_id, source, status, remark) values
((select id from users where student_id='60010001'), 1, 'admin_manual', 'approved', 'ตรวจสอบรหัสนักศึกษาแล้วตรงกับข้อมูลจบการศึกษา'),
((select id from users where student_id='60010001'), null, 'registrar_api', 'matched', 'ผลตรวจสอบจากสำนักทะเบียนตรงกัน'),
((select id from users where student_id='65010010'), 1, 'admin_manual', 'pending', null);

-- posts + poll (status='published' ให้ตรงกับ schema ใหม่)
insert into posts (admin_id, category, title, content, post_type, status, pinned, published_at) values
(1, 'ประกาศกิจกรรม', 'ขอเชิญร่วมงานคืนสู่เหย้าประจำปี 2569',
 'พบกันวันที่ 20 ธันวาคมนี้ ที่ Grand Hall กรุงเทพฯ ร่วมงานเลี้ยงรุ่นและมอบรางวัลศิษย์เก่าดีเด่นประจำปี', 'normal', 'published', true, now()),
(1, 'โพลสำรวจความเห็น', 'อยากได้ธีมงานคืนสู่เหย้าแบบไหน?', 'ร่วมโหวตธีมงานปีนี้ ได้คะแนนสะสมทันทีที่โหวต', 'poll', 'published', false, now());

-- ตัวอย่างคำขอโพสต์ที่ยังรออนุมัติ (สำหรับทดสอบหน้า admin)
insert into posts (admin_id, requested_by, category, title, content, post_type, status, pinned) values
(null, (select id from users where student_id='60010001'), 'ขอความช่วยเหลือ', 'ขอเชิญร่วมบริจาคหนังสือให้ห้องสมุด',
 'อยากชวนศิษย์เก่าร่วมกันบริจาคหนังสือให้รุ่นน้อง รบกวนแอดมินช่วยเผยแพร่ให้ด้วยครับ', 'normal', 'pending_request', false);

insert into post_interactions (post_id, user_id, type, content, points_earned) values
((select id from posts where title like 'ขอเชิญร่วมงาน%'), (select id from users where student_id='60010001'), 'comment', 'รอมางานนี้เลยครับ ปีนี้ไม่พลาด!', 1);

insert into post_interactions (post_id, user_id, type, emoji_option_id) values
((select id from posts where title like 'ขอเชิญร่วมงาน%'), (select id from users where student_id='61010045' or student_id is null limit 1), 'reaction', (select id from lookup_options where code='love'));

insert into polls (post_id, question, points_per_vote, status) values
((select id from posts where title like 'อยากได้ธีมงาน%'), 'เลือกธีมงานคืนสู่เหย้า', 5, 'active');

insert into poll_options (poll_id, option_text) values
((select id from polls limit 1), 'ธีมย้อนยุค (Retro)'),
((select id from polls limit 1), 'ธีมทะเล (Beach Party)');

insert into poll_votes (poll_id, option_id, user_id, points_awarded) values
((select id from polls limit 1), (select id from poll_options where option_text like 'ธีมย้อนยุค%'), (select id from users where student_id='60010001'), 5),
((select id from polls limit 1), (select id from poll_options where option_text like 'ธีมทะเล%'), (select id from users where student_id='61010045'), 5);

-- Hall of Fame
insert into hof_campaigns (title, status) values ('ศิษย์เก่าดีเด่นประจำปี 2569', 'open');

insert into hof_candidates (campaign_id, user_id, description) values
((select id from hof_campaigns limit 1), (select id from users where student_id='60010001'), 'พัฒนาแพลตฟอร์มศิษย์เก่าให้มหาวิทยาลัยฟรี'),
((select id from hof_campaigns limit 1), (select id from users where student_id='61010045'), 'ดูแลผู้ป่วยในพื้นที่ห่างไกลมากว่า 8 ปี'),
((select id from hof_campaigns limit 1), (select id from users where student_id='60010099'), 'สร้างงานให้คนในชุมชนกว่า 15 ตำแหน่ง');

insert into hof_votes (campaign_id, voter_id, candidate_id, vote_category, points) values
((select id from hof_campaigns limit 1), (select id from users where student_id='60010001'),
  (select id from hof_candidates where user_id=(select id from users where student_id='60010099')), 'same_generation', 5),
((select id from hof_campaigns limit 1), (select id from users where student_id='60010001'),
  (select id from hof_candidates where user_id=(select id from users where student_id='61010045')), 'other_generation', 10),
((select id from hof_campaigns limit 1), (select id from users where student_id='60010099'),
  (select id from hof_candidates where user_id=(select id from users where student_id='61010045')), 'other_generation', 10),
((select id from hof_campaigns limit 1), (select id from users where student_id='61010045'),
  (select id from hof_candidates where user_id=(select id from users where student_id='60010001')), 'other_generation', 10);

-- media_assets: user_gallery ของสมชาย + photo_archive 2 รูป
insert into media_assets (owner_type, owner_id, generation_option_id, uploaded_by, image_url, watermark_url, caption) values
('user_gallery', (select id from users where student_id='60010001'), null, (select id from users where student_id='60010001'),
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=400&q=60', null, 'งานรับปริญญา 2558'),
('user_gallery', (select id from users where student_id='60010001'), null, (select id from users where student_id='60010001'),
  'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=400&q=60', null, 'ทริปเพื่อนกลุ่ม IT'),
('photo_archive', null, (select id from lookup_options where code='gen-43'), 1,
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=700&q=60&blur=60',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80', 'พิธีรับปริญญา รุ่น 43'),
('photo_archive', null, (select id from lookup_options where code='gen-46'), 1,
  'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=700&q=60&blur=60',
  'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=900&q=80', 'ทริปเพื่อนกลุ่ม IT รุ่น 46');

insert into photo_tags (asset_id, tagged_user_id, tagged_by, tag_source) values
((select id from media_assets where caption='พิธีรับปริญญา รุ่น 43'), (select id from users where student_id='60010001'), 1, 'manual'),
((select id from media_assets where caption='พิธีรับปริญญา รุ่น 43'), (select id from users where student_id='60010099'), 1, 'ai');

insert into photo_view_verifications (asset_id, user_id, question, is_passed, points_earned) values
((select id from media_assets where caption='พิธีรับปริญญา รุ่น 43'), (select id from users where student_id='61010045'),
 'อาจารย์ที่ปรึกษาของรุ่นนี้ชื่ออะไร?', true, 5);

 -- ============================================================
-- เพิ่มข้อมูลจำลอง 10 คน สำหรับ Hall of Fame (มีคะแนนโหวตหลากหลาย)
-- วางต่อท้ายไฟล์ db/init.sql เดิม (ต่อจาก insert into photo_view_verifications เดิม)
-- ============================================================

insert into users (student_id, citizen_id_hash, email, name, generation_option_id, province_option_id, career_option_id, company, position, bio, avatar_url, role, status, total_points, hometown_province_id, work_province_id, show_hometown_on_map, show_workplace_on_map, student_status, expected_graduation_year) values
('62010021', 'hash_62010021', 'wipada.s@example.edu', 'วิภาดา ศรีสุข',
  (select id from lookup_options where code='gen-43'), (select id from lookup_options where code='th-nma'), (select id from lookup_options where code='career-gov'),
  'โรงเรียนราชสีมาวิทยาลัย', 'ครูสอนภาษาอังกฤษ', 'พัฒนาหลักสูตรภาษาอังกฤษให้เด็กในพื้นที่ห่างไกลกว่า 10 ปี',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80', 'alumni', 'approved', 9,
  (select id from lookup_options where code='th-nma'), (select id from lookup_options where code='th-nma'), true, true, 'alumni', 2015),

('62010022', 'hash_62010022', 'thanakorn.p@example.edu', 'ธนากร พงษ์พันธ์',
  (select id from lookup_options where code='gen-46'), (select id from lookup_options where code='th-cbi'), (select id from lookup_options where code='career-private'),
  'บริษัท ปตท. จำกัด (มหาชน)', 'วิศวกรปิโตรเลียม', 'ควบคุมดูแลระบบท่อขนส่งก๊าซธรรมชาติภาคตะวันออก',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', 'alumni', 'approved', 7,
  (select id from lookup_options where code='th-cbi'), (select id from lookup_options where code='th-cbi'), true, true, 'alumni', 2018),

('62010023', 'hash_62010023', 'orathai.m@example.edu', 'อรทัย มีสุข',
  (select id from lookup_options where code='gen-48'), (select id from lookup_options where code='th-cnx'), (select id from lookup_options where code='career-freelance'),
  'อิสระ', 'นักออกแบบกราฟิก', 'ออกแบบแบรนด์ให้ธุรกิจ SME ในภาคเหนือกว่า 50 ราย',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80', 'alumni', 'approved', 5,
  (select id from lookup_options where code='th-cnx'), (select id from lookup_options where code='th-cnx'), true, true, 'alumni', 2020),

('62010024', 'hash_62010024', 'prasert.y@example.edu', 'ประเสริฐ ยิ้มแย้ม',
  (select id from lookup_options where code='gen-43'), (select id from lookup_options where code='th-bkk'), (select id from lookup_options where code='career-private'),
  'สำนักงานกฎหมาย ยิ้มแย้ม แอนด์ พาร์ทเนอร์ส', 'ทนายความอาวุโส', 'ให้คำปรึกษากฎหมายฟรีแก่ศิษย์เก่าที่เดือดร้อนมากว่า 12 ปี',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80', 'alumni', 'approved', 14,
  (select id from lookup_options where code='th-bkk'), (select id from lookup_options where code='th-bkk'), true, true, 'alumni', 2015),

('62010025', 'hash_62010025', 'kamonchanok.s@example.edu', 'กมลชนก แสงทอง',
  (select id from lookup_options where code='gen-46'), (select id from lookup_options where code='th-bkk'), (select id from lookup_options where code='career-private'),
  'สถานีข่าวไทยพีบีเอส', 'ผู้สื่อข่าวสายสิ่งแวดล้อม', 'รายงานข่าวเชิงลึกด้านสิ่งแวดล้อมที่ได้รับรางวัลระดับประเทศ',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80', 'alumni', 'approved', 4,
  (select id from lookup_options where code='th-bkk'), (select id from lookup_options where code='th-bkk'), true, true, 'alumni', 2018),

('62010026', 'hash_62010026', 'chaiwat.r@example.edu', 'ชัยวัฒน์ รุ่งเรือง',
  (select id from lookup_options where code='gen-48'), (select id from lookup_options where code='th-phk'), (select id from lookup_options where code='career-own'),
  'ร้านอาหาร Rung Ruang Kitchen', 'เชฟเจ้าของร้าน', 'ร้านอาหารได้รับดาวมิชลินไกด์ 2 ปีซ้อน สร้างงานให้คนในพื้นที่กว่า 30 ตำแหน่ง',
  'https://images.unsplash.com/photo-1583195764036-6dc248ac07d9?auto=format&fit=crop&w=400&q=80', 'alumni', 'approved', 18,
  (select id from lookup_options where code='th-phk'), (select id from lookup_options where code='th-phk'), true, true, 'alumni', 2020),

('62010027', 'hash_62010027', 'napassorn.j@example.edu', 'นภัสสร ใจงาม',
  (select id from lookup_options where code='gen-43'), (select id from lookup_options where code='th-kkc'), (select id from lookup_options where code='career-private'),
  'บริษัท ใจงาม สถาปนิก จำกัด', 'สถาปนิกอาวุโส', 'ออกแบบอาคารประหยัดพลังงานให้หน่วยงานราชการในภาคอีสาน',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', 'alumni', 'approved', 6,
  (select id from lookup_options where code='th-kkc'), (select id from lookup_options where code='th-kkc'), true, true, 'alumni', 2015),

('62010028', 'hash_62010028', 'piyapong.p@example.edu', 'ปิยะพงษ์ เพชรดี',
  (select id from lookup_options where code='gen-46'), (select id from lookup_options where code='th-bkk'), (select id from lookup_options where code='career-private'),
  'บริษัท Petch Games Studio', 'ผู้ก่อตั้งและนักพัฒนาเกม', 'พัฒนาเกมมือถือที่มียอดดาวน์โหลดกว่า 2 ล้านครั้งทั่วโลก',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80', 'alumni', 'approved', 8,
  (select id from lookup_options where code='th-bkk'), (select id from lookup_options where code='th-bkk'), true, true, 'alumni', 2018),

('62010029', 'hash_62010029', 'sunisa.t@example.edu', 'สุนิสา ทองแท้',
  (select id from lookup_options where code='gen-48'), (select id from lookup_options where code='th-sni'), (select id from lookup_options where code='career-own'),
  'สวนผลไม้ทองแท้ ออร์แกนิค', 'เจ้าของธุรกิจเกษตรอินทรีย์', 'ส่งออกผลไม้อินทรีย์ไปยัง 5 ประเทศ สร้างรายได้ให้เกษตรกรในพื้นที่',
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=80', 'alumni', 'approved', 11,
  (select id from lookup_options where code='th-sni'), (select id from lookup_options where code='th-sni'), true, true, 'alumni', 2020),

('62010030', 'hash_62010030', 'anucha.s@example.edu', 'อนุชา ศักดิ์สิทธิ์',
  (select id from lookup_options where code='gen-43'), (select id from lookup_options where code='th-nkp'), (select id from lookup_options where code='career-gov'),
  'สมาคมกีฬาแห่งประเทศไทย', 'อดีตนักกีฬาทีมชาติ', 'เหรียญทองซีเกมส์ 2 สมัย ปัจจุบันเป็นผู้ฝึกสอนเยาวชน',
  'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=400&q=80', 'alumni', 'approved', 2,
  (select id from lookup_options where code='th-nkp'), (select id from lookup_options where code='th-nkp'), true, false, 'alumni', 2015);

-- เพิ่มเป็นผู้เข้าชิง Hall of Fame แคมเปญเดิม
insert into hof_candidates (campaign_id, user_id, description) values
((select id from hof_campaigns limit 1), (select id from users where student_id='62010021'), 'พัฒนาหลักสูตรภาษาอังกฤษให้เด็กในพื้นที่ห่างไกลกว่า 10 ปี'),
((select id from hof_campaigns limit 1), (select id from users where student_id='62010022'), 'ควบคุมดูแลระบบท่อขนส่งก๊าซธรรมชาติภาคตะวันออก'),
((select id from hof_campaigns limit 1), (select id from users where student_id='62010023'), 'ออกแบบแบรนด์ให้ธุรกิจ SME ในภาคเหนือกว่า 50 ราย'),
((select id from hof_campaigns limit 1), (select id from users where student_id='62010024'), 'ให้คำปรึกษากฎหมายฟรีแก่ศิษย์เก่าที่เดือดร้อนมากว่า 12 ปี'),
((select id from hof_campaigns limit 1), (select id from users where student_id='62010025'), 'รายงานข่าวเชิงลึกด้านสิ่งแวดล้อมที่ได้รับรางวัลระดับประเทศ'),
((select id from hof_campaigns limit 1), (select id from users where student_id='62010026'), 'ร้านอาหารได้รับดาวมิชลินไกด์ 2 ปีซ้อน สร้างงานให้คนในพื้นที่กว่า 30 ตำแหน่ง'),
((select id from hof_campaigns limit 1), (select id from users where student_id='62010027'), 'ออกแบบอาคารประหยัดพลังงานให้หน่วยงานราชการในภาคอีสาน'),
((select id from hof_campaigns limit 1), (select id from users where student_id='62010028'), 'พัฒนาเกมมือถือที่มียอดดาวน์โหลดกว่า 2 ล้านครั้งทั่วโลก'),
((select id from hof_campaigns limit 1), (select id from users where student_id='62010029'), 'ส่งออกผลไม้อินทรีย์ไปยัง 5 ประเทศ สร้างรายได้ให้เกษตรกรในพื้นที่'),
((select id from hof_campaigns limit 1), (select id from users where student_id='62010030'), 'เหรียญทองซีเกมส์ 2 สมัย ปัจจุบันเป็นผู้ฝึกสอนเยาวชน');

-- โหวตให้คะแนนหลากหลาย (ผลลัพธ์: ชัยวัฒน์ 30, ประเสริฐ 25, วิภาดา/ธนากร 20, อรทัย/ปิยะพงษ์ 10, กมลชนก/นภัสสร/สุนิสา 5, อนุชา 0)
insert into hof_votes (campaign_id, voter_id, candidate_id, vote_category, points) values
((select id from hof_campaigns limit 1), (select id from users where student_id='62010021'),
  (select id from hof_candidates where user_id=(select id from users where student_id='62010026')), 'other_generation', 10),
((select id from hof_campaigns limit 1), (select id from users where student_id='62010021'),
  (select id from hof_candidates where user_id=(select id from users where student_id='62010024')), 'same_generation', 5),

((select id from hof_campaigns limit 1), (select id from users where student_id='62010022'),
  (select id from hof_candidates where user_id=(select id from users where student_id='62010026')), 'other_generation', 10),
((select id from hof_campaigns limit 1), (select id from users where student_id='62010022'),
  (select id from hof_candidates where user_id=(select id from users where student_id='62010025')), 'same_generation', 5),

((select id from hof_campaigns limit 1), (select id from users where student_id='62010023'),
  (select id from hof_candidates where user_id=(select id from users where student_id='62010024')), 'other_generation', 10),
((select id from hof_campaigns limit 1), (select id from users where student_id='62010023'),
  (select id from hof_candidates where user_id=(select id from users where student_id='62010029')), 'same_generation', 5),

((select id from hof_campaigns limit 1), (select id from users where student_id='62010024'),
  (select id from hof_candidates where user_id=(select id from users where student_id='62010021')), 'other_generation', 10),
((select id from hof_campaigns limit 1), (select id from users where student_id='62010024'),
  (select id from hof_candidates where user_id=(select id from users where student_id='62010027')), 'same_generation', 5),

((select id from hof_campaigns limit 1), (select id from users where student_id='62010025'),
  (select id from hof_candidates where user_id=(select id from users where student_id='62010024')), 'other_generation', 10),
((select id from hof_campaigns limit 1), (select id from users where student_id='62010025'),
  (select id from hof_candidates where user_id=(select id from users where student_id='62010022')), 'same_generation', 5),

((select id from hof_campaigns limit 1), (select id from users where student_id='62010026'),
  (select id from hof_candidates where user_id=(select id from users where student_id='62010021')), 'other_generation', 10),
((select id from hof_campaigns limit 1), (select id from users where student_id='62010026'),
  (select id from hof_candidates where user_id=(select id from users where student_id='62010025')), 'same_generation', 5),

((select id from hof_campaigns limit 1), (select id from users where student_id='62010027'),
  (select id from hof_candidates where user_id=(select id from users where student_id='62010022')), 'other_generation', 10),

((select id from hof_campaigns limit 1), (select id from users where student_id='62010028'),
  (select id from hof_candidates where user_id=(select id from users where student_id='62010023')), 'other_generation', 10),

((select id from hof_campaigns limit 1), (select id from users where student_id='62010029'),
  (select id from hof_candidates where user_id=(select id from users where student_id='62010026')), 'other_generation', 10),

((select id from hof_campaigns limit 1), (select id from users where student_id='62010030'),
  (select id from hof_candidates where user_id=(select id from users where student_id='62010028')), 'other_generation', 10);