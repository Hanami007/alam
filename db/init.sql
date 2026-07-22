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
  extra         jsonb default '{}'::jsonb     -- เช่น {"year_start":2011,"year_end":2015} หรือ {"region":"เหนือ"}
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
  created_at          timestamptz not null default now()
);

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

-- 5) posts
create table posts (
  id            serial primary key,
  admin_id      int references users(id),
  category      text,
  title         text not null,
  content       text,
  post_type     text not null default 'normal', -- normal | poll
  pinned        boolean default false,
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

-- 13) photo_tags
create table photo_tags (
  id                serial primary key,
  asset_id          int references media_assets(id),
  tagged_user_id    int references users(id),
  tagged_by         int references users(id),
  tag_source        text not null default 'manual' -- manual | ai
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
('province', 'th-bkk', 'กรุงเทพมหานคร', '{"region":"กลาง"}'),
('province', 'th-cnx', 'เชียงใหม่', '{"region":"เหนือ"}'),
('province', 'th-kkc', 'ขอนแก่น', '{"region":"อีสาน"}'),
('province', 'th-cbi', 'ชลบุรี', '{"region":"ตะวันออก"}'),
('career_type', 'career-gov', 'ราชการ', '{}'),
('career_type', 'career-private', 'เอกชน', '{}'),
('career_type', 'career-own', 'ธุรกิจส่วนตัว', '{}'),
('career_type', 'career-freelance', 'ฟรีแลนซ์', '{}'),
('emoji', 'like', '👍 ถูกใจ', '{}'),
('emoji', 'love', '❤️ รักเลย', '{}');

-- users (id 1 = admin)
insert into users (student_id, citizen_id_hash, email, name, generation_option_id, province_option_id, career_option_id, company, position, bio, avatar_url, role, status, total_points) values
(null, null, 'admin@uni.ac.th', 'ผู้ดูแลระบบ', null, null, null, null, null, null, null, 'admin', 'approved', 0),
('60010001', 'hash_60010001', 'somchai.j@example.edu', 'สมชาย ใจดี',
  (select id from lookup_options where code='gen-43'), (select id from lookup_options where code='th-bkk'), (select id from lookup_options where code='career-private'),
  'บริษัท เอบีซี จำกัด', 'Senior Developer', 'ดูแลระบบและพัฒนาโปรดักต์ให้ทีมงานภายใน',
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=600&q=80', 'alumni', 'approved', 16),
('61010045', 'hash_61010045', 'somying.r@example.edu', 'สมหญิง รักเรียน',
  (select id from lookup_options where code='gen-46'), (select id from lookup_options where code='th-cnx'), (select id from lookup_options where code='career-gov'),
  'โรงพยาบาลนครพิงค์', 'พยาบาลวิชาชีพ', 'ดูแลผู้ป่วยในพื้นที่ห่างไกลมากว่า 8 ปี',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80', 'alumni', 'approved', 0),
('60010099', 'hash_60010099', 'somsak.m@example.edu', 'สมศักดิ์ มั่นคง',
  (select id from lookup_options where code='gen-43'), (select id from lookup_options where code='th-bkk'), (select id from lookup_options where code='career-own'),
  'ร้านกาแฟ Coffee Cool', 'เจ้าของร้าน', 'สร้างงานให้คนในชุมชนกว่า 15 ตำแหน่ง',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80', 'alumni', 'approved', 0),
('65010010', 'hash_65010010', 'paweena.t@example.edu', 'ปวีณา ตั้งใจสมัคร',
  (select id from lookup_options where code='gen-48'), null, null, null, null, null, null, 'alumni', 'pending', 0);

-- user_verifications
insert into user_verifications (user_id, admin_id, source, status, remark) values
((select id from users where student_id='60010001'), 1, 'admin_manual', 'approved', 'ตรวจสอบรหัสนักศึกษาแล้วตรงกับข้อมูลจบการศึกษา'),
((select id from users where student_id='60010001'), null, 'registrar_api', 'matched', 'ผลตรวจสอบจากสำนักทะเบียนตรงกัน'),
((select id from users where student_id='65010010'), 1, 'admin_manual', 'pending', null);

-- posts + poll
insert into posts (admin_id, category, title, content, post_type, pinned) values
(1, 'ประกาศกิจกรรม', 'ขอเชิญร่วมงานคืนสู่เหย้าประจำปี 2569',
 'พบกันวันที่ 20 ธันวาคมนี้ ที่ Grand Hall กรุงเทพฯ ร่วมงานเลี้ยงรุ่นและมอบรางวัลศิษย์เก่าดีเด่นประจำปี', 'normal', true),
(1, 'โพลสำรวจความเห็น', 'อยากได้ธีมงานคืนสู่เหย้าแบบไหน?', 'ร่วมโหวตธีมงานปีนี้ ได้คะแนนสะสมทันทีที่โหวต', 'poll', false);

insert into post_interactions (post_id, user_id, type, content, points_earned) values
((select id from posts where title like 'ขอเชิญ%'), (select id from users where student_id='60010001'), 'comment', 'รอมางานนี้เลยครับ ปีนี้ไม่พลาด!', 1);

insert into post_interactions (post_id, user_id, type, emoji_option_id) values
((select id from posts where title like 'ขอเชิญ%'), (select id from users where student_id='61010045' or student_id is null limit 1), 'reaction', (select id from lookup_options where code='love'));

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