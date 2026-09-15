/* eslint-disable camelcase */

/**
 * Migration 008 — Replace hardcoded mock data with real DB rows
 *
 * src/modules/hall-of-fame/components/hall-of-fame-grid.tsx (DEFAULT_CANDIDATES)
 * and src/modules/yearbook/components/yearbook-grid.tsx (MOCK_YEARBOOK_ALUMNI) had
 * hardcoded fake-person arrays baked into the React components — this migration
 * moves that exact content into real rows (users / hof_candidates) so the same
 * content now comes from the DB like everything else, and the hardcoded arrays
 * are deleted from the components in this same change.
 *
 * All rows inserted here are tagged with a `seed-hof-` / `seed-yearbook-` email
 * prefix so they're easy to find and remove later:
 *   DELETE FROM users WHERE email LIKE 'seed-hof-%' OR email LIKE 'seed-yearbook-%';
 *   (hof_candidates rows cascade-delete automatically via ON DELETE CASCADE — see
 *   migration 1750000001000_production-hardening.js)
 *
 * Two of the mock candidates used generation labels (รุ่น 38/40/41/42/44/45) that
 * migrations/1750000005000_cs-generations-sequence.js never generated (it only
 * covers gen 1-35) — this migration extends that same lookup_options sequence
 * for the missing numbers using the identical formula, rather than inventing a
 * one-off value.
 *
 * Three of the mock Hall of Fame candidates originally reused student_id values
 * that the mock yearbook alumni also used (61010045 / 60010099 / 59010022) —
 * harmless for two arrays that were never rendered together, but users.student_id
 * is UNIQUE, so this migration shifts those three HOF student_ids by a digit to
 * avoid a collision (noted per-row below).
 */

const MISSING_GENERATIONS = [38, 40, 41, 42, 44, 45];

const HOF_PEOPLE = [
  { studentId: '58010101', name: 'ดร.สมชาย วงศ์สุวรรณ', company: 'Tech Thailand Group', position: 'Chief Technology Officer (CTO)', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80', description: 'ผู้พัฒนาโซลูชัน AI ทางการแพทย์ และศิษย์เก่าผู้สร้างคุณประโยชน์ให้สถาบันอย่างต่อเนื่อง', genCode: 'gen-35' },
  { studentId: '61010145', name: 'ณิชาภัทร อัศวไพศาล', company: 'Innovate Soft Co., Ltd.', position: 'Senior Lead Software Engineer', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop&q=80', description: 'ผู้ก่อตั้งสตาร์ทอัพเทคโนโลยีศิษย์เก่าและวิทยากรพิเศษบรรยายสร้างแรงบันดาลใจให้นักศึกษา', genCode: 'gen-38' }, // was 61010045, shifted to avoid clash with yearbook #10
  { studentId: '60010199', name: 'กิตติศักดิ์ รัตนกาญจน์', company: 'CyberGuard Corp', position: 'Head of Cybersecurity', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80', description: 'ผู้เชี่ยวชาญด้านความปลอดภัยไซเบอร์ระดับประเทศ และที่ปรึกษาองค์กรภาครัฐและเอกชน', genCode: 'gen-40' }, // was 60010099, shifted to avoid clash with yearbook #11
  { studentId: '62010030', name: 'แพรวา สุวรรณรัตน์', company: 'DataMetrics Global', position: 'Principal Data Scientist', avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80', description: 'ผู้บุกเบิกการวิเคราะห์ข้อมูล Big Data เพื่อสังคมและขับเคลื่อนโครงการ Open Data', genCode: 'gen-41' },
  { studentId: '63010055', name: 'ธนากร เมธากุล', company: 'CloudWorks TH', position: 'DevOps & Infrastructure Lead', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80', description: 'ผู้จัดการระบบคลาวด์สเกลใหญ่และผู้สนับสนุนทุนการศึกษาแก่น้องๆ สาขาวิทยาการคอมพิวเตอร์', genCode: 'gen-42' },
  { studentId: '59010122', name: 'ศิรินทิพย์ จิระประเสริฐ', company: 'UX Design Studio', position: 'Head of Product Design', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80', description: 'ผู้ออกแบบแอปพลิเคชันที่มีผู้ใช้งานกว่า 1 ล้านคน และอาจารย์พิเศษด้าน Human-Computer Interaction', genCode: 'gen-43' }, // was 59010022, shifted to avoid clash with yearbook #12
  { studentId: '57010088', name: 'วรพล ทองคำ', company: 'Kasikorn Bank', position: 'VP, Digital Banking Platform', avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80', description: 'นักพัฒนาระบบธนาคารดิจิทัลชั้นนำของประเทศและผู้ร่วมจัดกิจกรรม Alumni Hackathon', genCode: 'gen-33' },
  { studentId: '64010012', name: 'ปิยะนุช แก้วมณี', company: 'LINE MAN Wongnai', position: 'Senior Product Manager', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80', description: 'ผู้บริหารผลิตภัณฑ์ดิจิทัลยอดนิยม และผู้จัดกิจกรรม Mentorship ให้คำปรึกษารุ่นน้อง', genCode: 'gen-44' },
  { studentId: '56010041', name: 'อนันต์ ทรงเจริญ', company: 'AgriTech Solutions', position: 'Founder & Managing Director', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80', description: 'ผู้ก่อตั้งระบบสมาร์ทฟาร์มด้วย IoT ผสานเกษตรกรรมกับเทคโนโลยีตามอัตลักษณ์แม่โจ้', genCode: 'gen-32' },
  { studentId: '65010018', name: 'ชิดชนก นิลพาณิชย์', company: 'Shopee E-Commerce', position: 'Frontend Tech Lead', avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80', description: 'วิศวกรซอฟต์แวร์รุ่นใหม่ไฟแรง ผู้ชนะรางวัลนวัตกรรมซอฟต์แวร์ระดับเยาวชนแห่งชาติ', genCode: 'gen-45' },
];

const YEARBOOK_PEOPLE = [
  { studentId: '18010001', name: 'ดร.ประสิทธิ์ ปัญญาดี', nickname: 'สิทธิ์', bio: 'สมัยพี่เรียนยังใช้ Punch Card เจาะรูโปรแกรม การบอร์ดคอมพิวเตอร์คือศิลปะของความอดทน 📜💾', company: 'มหาวิทยาลัยแม่โจ้', position: 'อดีตคณบดี & ที่ปรึกษาเทคโนโลยีสารสนเทศ', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&auto=format&fit=crop&q=80', genCode: 'gen-1', provinceCode: 'th-cnx', careerCode: 'career-gov' },
  { studentId: '22010012', name: 'คุณวิชัย เลิศพาณิชย์', nickname: 'วิชัย', bio: 'ยุคพี่ RAM 64KB ถือว่าหรูหราอลังการ วันนี้มือถือพวกเธอมี RAM เป็น Gigabyte ใช้ให้คุ้มนะน้อง! 💻', company: 'Siam Data Systems', position: 'กรรมการผู้จัดการ (Managing Director)', avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&auto=format&fit=crop&q=80', genCode: 'gen-5', provinceCode: 'th-bkk', careerCode: 'career-own' },
  { studentId: '27010045', name: 'คุณสมพร ศรีสุข', nickname: 'พร', bio: 'เขียน C++ บรรทัดเดียวลืมเซมิโคลอน หาบั๊กไป 3 วัน แต่ความภูมิใจตอนคอมไพล์ผ่านมันประเมินค่าไม่ได้ ⚙️', company: 'การไฟฟ้าส่วนภูมิภาค', position: 'Senior Infrastructure Advisor', avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80', genCode: 'gen-10', provinceCode: 'th-cnx', careerCode: 'career-gov' },
  { studentId: '32010088', name: 'คุณกมลวรรณ บุญมี', nickname: 'แอ๋ว', bio: 'อินเทอร์เน็ตโมเด็มต่อเสียงดัง ติ๊ด-ตี้-ตู้ สัญญาณหลุดทีต้องเริ่มดาวน์โหลดใหม่ แต่พวกเราไม่เคยท้อ 🌐', company: 'PTT Digital Solutions', position: 'Enterprise Solutions Director', avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80', genCode: 'gen-15', provinceCode: 'th-ryg', careerCode: 'career-private' },
  { studentId: '37010102', name: 'คุณชาญชัย มีสุข', nickname: 'ช้าง', bio: 'ผ่านวิกฤต Y2K มาได้ ก็ไม่มีบั๊กอะไรในโลกนี้ที่ทำให้พวกเรากลัวได้อีกแล้ว 🔥', company: 'ธนาคารกรุงเทพ จำกัด (มหาชน)', position: 'Vice President of IT Security', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80', genCode: 'gen-20', provinceCode: 'th-bkk', careerCode: 'career-private' },
  { studentId: '42010150', name: 'คุณสุพจน์ ใจกว้าง', nickname: 'พจน์', bio: 'จากยุค Web 1.0 หน้ากระดาษ HTML สีขาว สู่ยุค Cloud & AI... CS แม่โจ้สอนให้เราเรียนรู้ไม่มีวันสิ้นสุด 🚀', company: 'True Digital Group', position: 'Principal Cloud Architect', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80', genCode: 'gen-25', provinceCode: 'th-nnt', careerCode: 'career-private' },
  { studentId: '47010210', name: 'คุณนภา รัตนตระกูล', nickname: 'นก', bio: 'ตอนเรียนมุ่งมั่นจะเขียนโค้ดเปลี่ยนโลก ตอนทำงานขอแค่ Server ไม่ล่มตอนคืนวันศุกร์ก็พอ 🙏✨', company: 'Shopee (Thailand)', position: 'Software Engineering Director', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&auto=format&fit=crop&q=80', genCode: 'gen-30', provinceCode: 'th-bkk', careerCode: 'career-private' },
  { studentId: '49010250', name: 'คุณปรีชา เจริญกิจ', nickname: 'ชา', bio: 'เขียน SQL Query ซับซ้อนแค่ไหนไม่เคยกลัว กลัวที่สุดคือลืมใส่ WHERE Clause ในคำสั่ง DELETE 😱', company: 'Central Group', position: 'Head of Data Platform', avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&auto=format&fit=crop&q=80', genCode: 'gen-32', provinceCode: 'th-cnx', careerCode: 'career-private' },
  { studentId: '60010001', name: 'สมชาย ใจดี', nickname: 'ชาย', bio: 'I spent 4 years learning CS just to realize the solution was restarting the computer 💻', company: 'Agoda (Thailand)', position: 'Senior Full-stack Developer', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80', genCode: 'gen-43', provinceCode: 'th-cnx', careerCode: 'career-private' },
  { studentId: '61010045', name: 'สมหญิง รักเรียน', nickname: 'หญิง', bio: 'Data beats opinion every single time... แต่ถ้าปวดหัวให้กินพารา ยาไม่ได้ช่วยให้เข้าใจ AI หรอก 📊✨', company: 'SCB TechX', position: 'Lead AI / Data Scientist', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80', genCode: 'gen-44', provinceCode: 'th-bkk', careerCode: 'career-private' },
  { studentId: '60010099', name: 'สมศักดิ์ มั่นคง', nickname: 'ศักดิ์', bio: 'เรียนคอมเพราะคิดว่าจะได้เล่นเกม สุดท้ายจบมานั่งตั้งค่า Server ตอนตี 3 ☕', company: 'DevScale Studio', position: 'Chief Technology Officer', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80', genCode: 'gen-43', provinceCode: 'th-cnx', careerCode: 'career-own' },
  { studentId: '59010022', name: 'ณิชานันท์ เจริญผล', nickname: 'พลอย', bio: 'Design is not just what it looks like... แต่คือการเปลี่ยนสีปุ่มตามใจลูกค้าตอน 5 โมงเย็น 🎨', company: 'LINE MAN Wongnai', position: 'Senior UX Designer', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80', genCode: 'gen-42', provinceCode: 'th-nnt', careerCode: 'career-private' },
  { studentId: '62010114', name: 'กิตติพงษ์ วัฒนา', nickname: 'ท็อป', bio: 'Security is not a feature, it is a lifestyle... และพาสเวิร์ดที่ดีที่สุดคือ 123456 (ล้อเล่นนะ!) 🛡️🔒', company: 'KBTG', position: 'Security Specialist', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80', genCode: 'gen-45', provinceCode: 'th-crn', careerCode: 'career-private' },
  { studentId: '63010088', name: 'ภัทรพล สุขเสริฐ', nickname: 'พีท', bio: 'อย่าเอาเกรดเฉลี่ยมาตัดสินเรา เพราะเกรด 2.01 ก็เขียนบั๊กได้เนียนพอๆ กับเกรด 4.0 🐛', company: 'Agoda (Thailand)', position: 'Junior Frontend Engineer', avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80', genCode: 'gen-46', provinceCode: 'th-cnx', careerCode: 'career-private' },
];

exports.up = async (pgm) => {
  // ─── 1. เติม generation lookup ที่ขาด (สูตรเดียวกับ migration 005) ───────────
  for (const gen of MISSING_GENERATIONS) {
    const prefix = gen + 37;
    const entryYearBE = 2500 + prefix;
    const entryYearCE = entryYearBE - 543;
    const code = `gen-${gen}`;
    const label = `รุ่น ${gen}`;
    const extra = {
      gen_number: gen,
      prefix: String(prefix),
      entry_year_be: entryYearBE,
      year_start: entryYearCE,
      year_end: entryYearCE + 4,
    };
    await pgm.db.query(
      `INSERT INTO lookup_options (category, code, label, extra)
       VALUES ('generation', $1, $2, $3::jsonb)
       ON CONFLICT (category, code) DO UPDATE SET label = EXCLUDED.label, extra = EXCLUDED.extra`,
      [code, label, JSON.stringify(extra)]
    );
  }

  // ─── 2. Hall of Fame candidates ──────────────────────────────────────────────
  const [campaign] = await pgm.db.select(
    `SELECT id FROM hof_campaigns WHERE status = 'open' ORDER BY id LIMIT 1`
  );
  const campaignId = campaign?.id;

  for (const p of HOF_PEOPLE) {
    const [gen] = await pgm.db.select(
      `SELECT id FROM lookup_options WHERE category = 'generation' AND code = $1`,
      [p.genCode]
    );

    const [user] = await pgm.db.select(
      `INSERT INTO users (student_id, email, name, company, position, avatar_url, generation_option_id, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'alumni', 'approved')
       ON CONFLICT (student_id) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [p.studentId, `seed-hof-${p.studentId}@mju.ac.th`, p.name, p.company, p.position, p.avatarUrl, gen?.id ?? null]
    );

    if (campaignId && user?.id) {
      await pgm.db.query(
        `INSERT INTO hof_candidates (campaign_id, user_id, description)
         SELECT $1, $2, $3
         WHERE NOT EXISTS (
           SELECT 1 FROM hof_candidates WHERE campaign_id = $1 AND user_id = $2
         )`,
        [campaignId, user.id, p.description]
      );
    }
  }

  // ─── 3. Yearbook alumni ──────────────────────────────────────────────────────
  for (const p of YEARBOOK_PEOPLE) {
    const [gen] = await pgm.db.select(
      `SELECT id FROM lookup_options WHERE category = 'generation' AND code = $1`,
      [p.genCode]
    );
    const [prov] = await pgm.db.select(
      `SELECT id FROM lookup_options WHERE category = 'province' AND code = $1`,
      [p.provinceCode]
    );
    const [career] = await pgm.db.select(
      `SELECT id FROM lookup_options WHERE category = 'career_type' AND code = $1`,
      [p.careerCode]
    );

    await pgm.db.query(
      `INSERT INTO users (
         student_id, email, name, nickname, bio, company, position, avatar_url,
         generation_option_id, province_option_id, career_option_id, role, status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'alumni', 'approved')
       ON CONFLICT (student_id) DO UPDATE SET
         name = EXCLUDED.name, nickname = EXCLUDED.nickname, bio = EXCLUDED.bio`,
      [
        p.studentId, `seed-yearbook-${p.studentId}@mju.ac.th`, p.name, p.nickname, p.bio,
        p.company, p.position, p.avatarUrl, gen?.id ?? null, prov?.id ?? null, career?.id ?? null,
      ]
    );
  }
};

exports.down = async (pgm) => {
  await pgm.db.query(`DELETE FROM users WHERE email LIKE 'seed-hof-%' OR email LIKE 'seed-yearbook-%'`);

  for (const gen of MISSING_GENERATIONS) {
    await pgm.db.query(
      `DELETE FROM lookup_options
       WHERE category = 'generation' AND code = $1
         AND NOT EXISTS (SELECT 1 FROM users WHERE generation_option_id = lookup_options.id)
         AND NOT EXISTS (SELECT 1 FROM media_assets WHERE generation_option_id = lookup_options.id)`,
      [`gen-${gen}`]
    );
  }
};
