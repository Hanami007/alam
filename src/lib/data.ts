// ⚠️ ไฟล์นี้เป็น mock data ชุดเดิม ไม่ได้ถูกใช้จริงแล้วในหน้า dashboard/feed/gallery/
// hall-of-fame/map/profile (ทุกหน้าเปลี่ยนไปดึงจาก Postgres ผ่าน src/lib/db.ts แทน)
// เก็บไว้เผื่อมีโค้ดส่วนอื่นในโปรเจคยัง import จากที่นี่อยู่ ลบทิ้งได้ถ้าไม่มีที่ไหนใช้แล้ว
//
// ข้อมูลจำลอง (mock data) อ้างอิงตาม ER ที่ตกลงกันไว้:
// - lookup_options: generations / provinces / career_types
// - users.total_points: คะแนนสะสม (comment +1, poll vote +5, hof vote +5/+10, unlock photo +5)
// - hof_votes.points: 5 = โหวตในรุ่น, 10 = โหวตนอกรุ่น
// - media_assets: ใช้ owner_type แยก post / user_gallery / photo_archive

export type Generation = {
  id: string;
  name: string; // เช่น "รุ่น 43"
  yearStart: number;
  yearEnd: number;
};

export const generations: Generation[] = [
  { id: 'gen-43', name: 'รุ่น 43', yearStart: 2011, yearEnd: 2015 },
  { id: 'gen-46', name: 'รุ่น 46', yearStart: 2014, yearEnd: 2018 },
  { id: 'gen-48', name: 'รุ่น 48', yearStart: 2016, yearEnd: 2020 },
];

export type Province = {
  id: string;
  name: string;
  region: string;
};

export const provinces: Province[] = [
  { id: 'th-bkk', name: 'กรุงเทพมหานคร', region: 'กลาง' },
  { id: 'th-cnx', name: 'เชียงใหม่', region: 'เหนือ' },
  { id: 'th-kkc', name: 'ขอนแก่น', region: 'อีสาน' },
  { id: 'th-cbi', name: 'ชลบุรี', region: 'ตะวันออก' },
];

export type CareerType = {
  id: string;
  name: string; // ราชการ / เอกชน / ธุรกิจส่วนตัว / ฟรีแลนซ์
};

export const careerTypes: CareerType[] = [
  { id: 'career-gov', name: 'ราชการ' },
  { id: 'career-private', name: 'เอกชน' },
  { id: 'career-own', name: 'ธุรกิจส่วนตัว' },
  { id: 'career-freelance', name: 'ฟรีแลนซ์' },
];

// ---------- alumniProfiles: ใช้ทั้งหน้า Dashboard (featured) และหน้า Hall of Fame ----------
export type AlumniProfile = {
  id: string;
  name: string;
  image: string;
  department: string;
  faculty: string;
  generation: string;
  occupation: string;
  company: string;
  employmentType: string;
  achievement: string;
  hofPoints: number; // ผลรวมคะแนนจาก hof_votes (5 = ในรุ่น, 10 = นอกรุ่น ต่อโหวต)
  isCandidate: boolean; // อยู่ในแคมเปญ Hall of Fame ปีนี้หรือไม่
};

export const alumniProfiles: AlumniProfile[] = [
  {
    id: 'u-2',
    name: 'สมชาย ใจดี',
    image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=600&q=80',
    department: 'วิศวกรรมคอมพิวเตอร์',
    faculty: 'วิศวกรรมศาสตร์',
    generation: 'รุ่น 43',
    occupation: 'Senior Developer',
    company: 'บริษัท เอบีซี จำกัด',
    employmentType: 'เอกชน',
    achievement: 'พัฒนาแพลตฟอร์มศิษย์เก่าให้มหาวิทยาลัยฟรี',
    hofPoints: 15,
    isCandidate: true,
  },
  {
    id: 'u-3',
    name: 'สมหญิง รักเรียน',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
    department: 'พยาบาลศาสตร์',
    faculty: 'พยาบาลศาสตร์',
    generation: 'รุ่น 46',
    occupation: 'พยาบาลวิชาชีพ',
    company: 'โรงพยาบาลนครพิงค์',
    employmentType: 'ราชการ',
    achievement: 'ดูแลผู้ป่วยในพื้นที่ห่างไกลมากว่า 8 ปี',
    hofPoints: 30,
    isCandidate: true,
  },
  {
    id: 'u-4',
    name: 'สมศักดิ์ มั่นคง',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
    department: 'บริหารธุรกิจ',
    faculty: 'บริหารธุรกิจ',
    generation: 'รุ่น 43',
    occupation: 'เจ้าของร้าน',
    company: 'ร้านกาแฟ Coffee Cool',
    employmentType: 'ธุรกิจส่วนตัว',
    achievement: 'สร้างงานให้คนในชุมชนกว่า 15 ตำแหน่ง',
    hofPoints: 10,
    isCandidate: true,
  },
];

// ---------- feedPosts: posts + post_interactions (comment/reaction) + polls ----------
export type PollOption = {
  id: string;
  text: string;
  votes: number;
};

export type FeedPost = {
  id: string;
  category: string;
  title: string;
  author: string; // admin เท่านั้นที่โพสต์ได้
  createdAt: string;
  body: string;
  image?: string;
  pinned: boolean;
  likes: number;
  comments: number;
  commentPoints: number; // คอมเมนต์ 1 ครั้ง = +1 คะแนน
  poll?: {
    question: string;
    pointsPerVote: number; // โหวตโพล = +5 คะแนน
    options: PollOption[];
  };
};

export const feedPosts: FeedPost[] = [
  {
    id: 'post-1',
    category: 'ประกาศกิจกรรม',
    title: 'ขอเชิญร่วมงานคืนสู่เหย้าประจำปี 2569',
    author: 'ผู้ดูแลระบบ',
    createdAt: '15 ม.ค. 2569',
    body: 'พบกันวันที่ 20 ธันวาคมนี้ ที่ Grand Hall กรุงเทพฯ ร่วมงานเลี้ยงรุ่นและมอบรางวัลศิษย์เก่าดีเด่นประจำปี',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80',
    pinned: true,
    likes: 2,
    comments: 1,
    commentPoints: 1,
  },
  {
    id: 'post-2',
    category: 'โพลสำรวจความเห็น',
    title: 'อยากได้ธีมงานคืนสู่เหย้าแบบไหน?',
    author: 'ผู้ดูแลระบบ',
    createdAt: '20 ม.ค. 2569',
    body: 'ร่วมโหวตธีมงานปีนี้ ได้คะแนนสะสมทันทีที่โหวต',
    pinned: false,
    likes: 0,
    comments: 0,
    commentPoints: 1,
    poll: {
      question: 'เลือกธีมงานคืนสู่เหย้า',
      pointsPerVote: 5,
      options: [
        { id: 'opt-retro', text: 'ธีมย้อนยุค (Retro)', votes: 1 },
        { id: 'opt-beach', text: 'ธีมทะเล (Beach Party)', votes: 1 },
      ],
    },
  },
];

// ---------- galleryItems: media_assets (owner_type = photo_archive) + photo_tags/photo_view_verifications ----------
export type GalleryItem = {
  id: string;
  title: string;
  album: string;
  generation: string;
  year: number;
  image: string; // รูปมีลายน้ำ (แสดงทั่วไป)
  originalImage: string; // รูปต้นฉบับ ปลดล็อกได้หลังตอบคำถามถูก
  tags: string[]; // ชื่อคนที่ถูกแท็กในรูป
  locked: boolean;
  unlockQuestion: string;
  pointsForUnlock: number; // ตอบถูก = +5 คะแนน
};

export const galleryItems: GalleryItem[] = [
  {
    id: 'photo-1',
    title: 'พิธีรับปริญญา รุ่น 43',
    album: 'อัลบั้มรุ่น 43',
    generation: 'รุ่น 43',
    year: 2015,
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=700&q=60&blur=60',
    originalImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80',
    tags: ['สมชาย ใจดี', 'สมศักดิ์ มั่นคง'],
    locked: true,
    unlockQuestion: 'อาจารย์ที่ปรึกษาของรุ่นนี้ชื่ออะไร?',
    pointsForUnlock: 5,
  },
  {
    id: 'photo-2',
    title: 'ทริปเพื่อนกลุ่ม IT',
    album: 'อัลบั้มรุ่น 46',
    generation: 'รุ่น 46',
    year: 2018,
    image: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=700&q=60&blur=60',
    originalImage: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=900&q=80',
    tags: ['สมหญิง รักเรียน'],
    locked: false,
    unlockQuestion: 'ชื่อเล่นของประธานรุ่นคืออะไร?',
    pointsForUnlock: 5,
  },
];

// ---------- province distribution: ใช้กับหน้าแผนที่ศิษย์เก่า (สรุปจาก users.province_id) ----------
export type ProvinceStat = {
  province: string;
  count: number;
  topCareerType: string;
};

export const provinceStats: ProvinceStat[] = [
  { province: 'กรุงเทพมหานคร', count: 3200, topCareerType: 'เอกชน' },
  { province: 'เชียงใหม่', count: 1180, topCareerType: 'ธุรกิจส่วนตัว' },
  { province: 'ขอนแก่น', count: 870, topCareerType: 'ราชการ' },
  { province: 'ชลบุรี', count: 1020, topCareerType: 'ราชการ' },
];

// ---------- current logged-in user (สำหรับหน้าโปรไฟล์) ----------
export type ActivityLogItem = {
  id: string;
  description: string;
  points: number;
  createdAt: string;
};

export const currentUser = {
  id: 'u-2',
  name: 'สมชาย ใจดี',
  studentId: '60010001',
  email: 'somchai.j@example.edu',
  phone: '+66 81 222 3456',
  generation: 'รุ่น 43',
  province: 'กรุงเทพมหานคร',
  careerType: 'เอกชน',
  company: 'บริษัท เอบีซี จำกัด',
  position: 'Senior Developer',
  bio: 'ดูแลระบบและพัฒนาโปรดักต์ให้ทีมงานภายใน',
  totalPoints: 16, // cache จาก users.total_points
  avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=600&q=80',
  galleryImages: [
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=400&q=60',
  ],
};

export const activityLog: ActivityLogItem[] = [
  { id: 'act-1', description: 'โหวตโพลเลือกธีมงานคืนสู่เหย้า', points: 5, createdAt: '1 ก.พ. 2569' },
  { id: 'act-2', description: 'โหวต Hall of Fame ให้สมหญิง รักเรียน (นอกรุ่น)', points: 10, createdAt: '5 ก.พ. 2569' },
  { id: 'act-3', description: 'คอมเมนต์ในโพสต์ประกาศงานคืนสู่เหย้า', points: 1, createdAt: '16 ม.ค. 2569' },
];

// ---------- แดชบอร์ดภาพรวม ----------
export const dashboardStats = {
  totalAlumni: 12400,
  totalAlumniDelta: '+8.2%',
  totalGenerations: generations.length,
  outstandingAlumni: alumniProfiles.filter((a) => a.isCandidate).length,
  outstandingAlumniDelta: '+2',
  pendingApprovals: 1,
};