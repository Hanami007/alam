import { pool } from '@/lib/db';

export interface MapPoint {
  id: number;
  name: string;
  avatar_url?: string;
  position?: string;
  company?: string;
  generation?: string;
  career_type?: string;
  student_status?: string;
  province_id: number;
  province_name: string;
  region: string;
  metro: boolean;
  is_international?: boolean;
  country_code?: string;
  flag?: string;
  lat?: number;
  lng?: number;
  city?: string;
}

const DEFAULT_HOMETOWN_POINTS: MapPoint[] = [
  // ─── กรุงเทพมหานคร (หนาแน่น: 8 คน) ───
  {
    id: 101,
    name: 'สมหญิง รักเรียน',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
    position: 'Lead AI Scientist',
    company: 'SCB TechX',
    generation: 'รุ่น 44',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 2,
    province_name: 'กรุงเทพมหานคร',
    region: 'กลาง',
    metro: true,
  },
  {
    id: 102,
    name: 'ณัฐพงษ์ เลิศอนันต์',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80',
    position: 'Cloud Architect',
    company: 'LINE Man Wongnai',
    generation: 'รุ่น 41',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 2,
    province_name: 'กรุงเทพมหานคร',
    region: 'กลาง',
    metro: true,
  },
  {
    id: 103,
    name: 'พัชรีพร โสภณ',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    position: 'Product Designer',
    company: 'True Digital Group',
    generation: 'รุ่น 45',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 2,
    province_name: 'กรุงเทพมหานคร',
    region: 'กลาง',
    metro: true,
  },
  {
    id: 104,
    name: 'อัครพล ชนะสิทธิ์',
    avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80',
    position: 'Full Stack Engineer',
    company: 'Grab Thailand',
    generation: 'รุ่น 42',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 2,
    province_name: 'กรุงเทพมหานคร',
    region: 'กลาง',
    metro: true,
  },
  {
    id: 105,
    name: 'จิราภรณ์ มณีวรรณ',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    position: 'Frontend Specialist',
    company: 'Shopee Thailand',
    generation: 'รุ่น 46',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 2,
    province_name: 'กรุงเทพมหานคร',
    region: 'กลาง',
    metro: true,
  },
  {
    id: 106,
    name: 'ธีรศักดิ์ ดวงใจ',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    position: 'DevOps Engineer',
    company: 'Agoda (Bangkok)',
    generation: 'รุ่น 40',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 2,
    province_name: 'กรุงเทพมหานคร',
    region: 'กลาง',
    metro: true,
  },
  {
    id: 107,
    name: 'กมลชนก สุริยะ',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    position: 'นักศึกษาชั้นปีที่ 3',
    company: 'CS แม่โจ้',
    generation: 'รุ่น 47',
    career_type: 'นักศึกษา',
    student_status: 'studying',
    province_id: 2,
    province_name: 'กรุงเทพมหานคร',
    region: 'กลาง',
    metro: true,
  },
  {
    id: 108,
    name: 'รพีพร เก่งกล้า',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    position: 'QA Automation Lead',
    company: 'Ascend Money',
    generation: 'รุ่น 39',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 2,
    province_name: 'กรุงเทพมหานคร',
    region: 'กลาง',
    metro: true,
  },

  // ─── เชียงใหม่ (หนาแน่น: 6 คน) ───
  {
    id: 109,
    name: 'สมชาย ใจดี',
    avatar_url: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=600&q=80',
    position: 'Senior Developer',
    company: 'Agoda (Thailand)',
    generation: 'รุ่น 43',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 1,
    province_name: 'เชียงใหม่',
    region: 'เหนือ',
    metro: false,
  },
  {
    id: 110,
    name: 'สมศักดิ์ มั่นคง',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    position: 'CTO',
    company: 'DevScale Studio',
    generation: 'รุ่น 43',
    career_type: 'ธุรกิจส่วนตัว',
    student_status: 'alumni',
    province_id: 1,
    province_name: 'เชียงใหม่',
    region: 'เหนือ',
    metro: false,
  },
  {
    id: 111,
    name: 'ปรัชญา พงษ์ไพบูลย์',
    avatar_url: 'https://images.unsplash.com/photo-1528892952291-009c663ce843?auto=format&fit=crop&w=600&q=80',
    position: 'Founder & CEO',
    company: 'Lanna Tech Lab',
    generation: 'รุ่น 38',
    career_type: 'ธุรกิจส่วนตัว',
    student_status: 'alumni',
    province_id: 1,
    province_name: 'เชียงใหม่',
    region: 'เหนือ',
    metro: false,
  },
  {
    id: 112,
    name: 'นภาพร จินดา',
    avatar_url: 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=600&q=80',
    position: 'Data Analyst',
    company: 'Nimman Analytics',
    generation: 'รุ่น 45',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 1,
    province_name: 'เชียงใหม่',
    region: 'เหนือ',
    metro: false,
  },
  {
    id: 113,
    name: 'วีระชัย สุขเกษม',
    avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80',
    position: 'อาจารย์สาขาวิทยาการคอมพิวเตอร์',
    company: 'มหาวิทยาลัยแม่โจ้',
    generation: 'รุ่น 35',
    career_type: 'รับราชการ/รัฐวิสาหกิจ',
    student_status: 'alumni',
    province_id: 1,
    province_name: 'เชียงใหม่',
    region: 'เหนือ',
    metro: false,
  },
  {
    id: 114,
    name: 'อนุชา อินทร์แก้ว',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
    position: 'นักศึกษาชั้นปีที่ 4',
    company: 'CS แม่โจ้',
    generation: 'รุ่น 48',
    career_type: 'นักศึกษา',
    student_status: 'studying',
    province_id: 1,
    province_name: 'เชียงใหม่',
    region: 'เหนือ',
    metro: false,
  },

  // ─── ชลบุรี (ปานกลาง: 4 คน) ───
  {
    id: 115,
    name: 'ธิดารัตน์ วิเศษศิลป์',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    position: 'System Analyst',
    company: 'PTT Digital',
    generation: 'รุ่น 44',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 4,
    province_name: 'ชลบุรี',
    region: 'ตะวันออก',
    metro: false,
  },
  {
    id: 116,
    name: 'เอกชัย ศรีราชา',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    position: 'IoT Engineer',
    company: 'Eastern Seaboard Automation',
    generation: 'รุ่น 42',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 4,
    province_name: 'ชลบุรี',
    region: 'ตะวันออก',
    metro: false,
  },
  {
    id: 117,
    name: 'ชลธิชา บุญช่วย',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    position: 'IT Business Partner',
    company: 'Mitsubishi Motors (Laem Chabang)',
    generation: 'รุ่น 41',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 4,
    province_name: 'ชลบุรี',
    region: 'ตะวันออก',
    metro: false,
  },
  {
    id: 118,
    name: 'วิภาดา รุ่งเรือง',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    position: 'Network Administrator',
    company: 'Amata City Tech',
    generation: 'รุ่น 45',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 4,
    province_name: 'ชลบุรี',
    region: 'ตะวันออก',
    metro: false,
  },

  // ─── ขอนแก่น (ปานกลาง: 3 คน) ───
  {
    id: 119,
    name: 'กิตติศักดิ์ แซ่ลิ้ม',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    position: 'Security Engineer',
    company: 'KBTG',
    generation: 'รุ่น 45',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 3,
    province_name: 'ขอนแก่น',
    region: 'อีสาน',
    metro: false,
  },
  {
    id: 120,
    name: 'สายฝน มิตรสหาย',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    position: 'Mobile Developer',
    company: 'Isan Software',
    generation: 'รุ่น 46',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 3,
    province_name: 'ขอนแก่น',
    region: 'อีสาน',
    metro: false,
  },
  {
    id: 121,
    name: 'จิรายุ ภูเวียง',
    avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80',
    position: 'Software Consultant',
    company: 'Khon Kaen Smart City',
    generation: 'รุ่น 40',
    career_type: 'รับราชการ/รัฐวิสาหกิจ',
    student_status: 'alumni',
    province_id: 3,
    province_name: 'ขอนแก่น',
    region: 'อีสาน',
    metro: false,
  },

  // ─── นนทบุรี (ปานกลาง: 3 คน) ───
  {
    id: 122,
    name: 'พิชญ์ วิทยศักดิ์',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80',
    position: 'Senior Backend Engineer',
    company: 'AIS Digital',
    generation: 'รุ่น 43',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 12,
    province_name: 'นนทบุรี',
    region: 'กลาง',
    metro: true,
  },
  {
    id: 123,
    name: 'อรทัย รักษาสัตย์',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
    position: 'Data Scientist',
    company: 'สำนักงานสถิติแห่งชาติ',
    generation: 'รุ่น 44',
    career_type: 'รับราชการ/รัฐวิสาหกิจ',
    student_status: 'alumni',
    province_id: 12,
    province_name: 'นนทบุรี',
    region: 'กลาง',
    metro: true,
  },
  {
    id: 124,
    name: 'ชนินทร์ บางบัวทอง',
    avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80',
    position: 'Tech Lead',
    company: 'Impact Innovation',
    generation: 'รุ่น 41',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 12,
    province_name: 'นนทบุรี',
    region: 'กลาง',
    metro: true,
  },

  // ─── นครราชสีมา (ปานกลาง: 3 คน) ───
  {
    id: 125,
    name: 'สุรเชษฐ์ โคราชพิทักษ์',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    position: 'Enterprise Architect',
    company: 'Korat Tech Valley',
    generation: 'รุ่น 39',
    career_type: 'ธุรกิจส่วนตัว',
    student_status: 'alumni',
    province_id: 13,
    province_name: 'นครราชสีมา',
    region: 'อีสาน',
    metro: false,
  },
  {
    id: 126,
    name: 'พัชรินทร์ ปากช่อง',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    position: 'Scrum Master',
    company: 'Betagro Digital Hub',
    generation: 'รุ่น 43',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 13,
    province_name: 'นครราชสีมา',
    region: 'อีสาน',
    metro: false,
  },
  {
    id: 127,
    name: 'ภานุพงศ์ เมืองย่าโม',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    position: 'Fullstack Dev',
    company: 'Freelance Tech',
    generation: 'รุ่น 47',
    career_type: 'ธุรกิจส่วนตัว',
    student_status: 'alumni',
    province_id: 13,
    province_name: 'นครราชสีมา',
    region: 'อีสาน',
    metro: false,
  },

  // ─── ภูเก็ต (น้อย: 2 คน) ───
  {
    id: 128,
    name: 'ปิยะวัฒน์ ทะเลใต้',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
    position: 'Senior React Developer',
    company: 'Phuket Software Island',
    generation: 'รุ่น 42',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 14,
    province_name: 'ภูเก็ต',
    region: 'ใต้',
    metro: false,
  },
  {
    id: 129,
    name: 'อัญชลี อันดามัน',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    position: 'UX Researcher',
    company: 'Hospitality Tech Group',
    generation: 'รุ่น 45',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 14,
    province_name: 'ภูเก็ต',
    region: 'ใต้',
    metro: false,
  },

  // ─── สงขลา (น้อย: 2 คน) ───
  {
    id: 130,
    name: 'ศุภกิตติ์ หาดใหญ่',
    avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80',
    position: 'นักวิชาการคอมพิวเตอร์',
    company: 'มหาวิทยาลัยสงขลานครินทร์',
    generation: 'รุ่น 40',
    career_type: 'รับราชการ/รัฐวิสาหกิจ',
    student_status: 'alumni',
    province_id: 15,
    province_name: 'สงขลา',
    region: 'ใต้',
    metro: false,
  },
  {
    id: 131,
    name: 'วรรณภา สมิหลา',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    position: 'Database Administrator',
    company: 'Southern Gulf Solutions',
    generation: 'รุ่น 44',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 15,
    province_name: 'สงขลา',
    region: 'ใต้',
    metro: false,
  },

  // ─── เชียงราย (น้อย: 2 คน) ───
  {
    id: 132,
    name: 'ดวงกมล เหนือสุดสยาม',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
    position: 'Software Developer',
    company: 'Chiang Rai AgriTech',
    generation: 'รุ่น 46',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 16,
    province_name: 'เชียงราย',
    region: 'เหนือ',
    metro: false,
  },
  {
    id: 133,
    name: 'ธีรพล แม่สาย',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    position: 'IT Support Lead',
    company: 'โรงพยาบาลเชียงรายประชานุเคราะห์',
    generation: 'รุ่น 41',
    career_type: 'รับราชการ/รัฐวิสาหกิจ',
    student_status: 'alumni',
    province_id: 16,
    province_name: 'เชียงราย',
    region: 'เหนือ',
    metro: false,
  },

  // ─── พิษณุโลก (น้อย: 2 คน) ───
  {
    id: 134,
    name: 'อภิสิทธิ์ สองแคว',
    avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80',
    position: 'AI Engineer',
    company: 'Naresuan Innovation',
    generation: 'รุ่น 44',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 17,
    province_name: 'พิษณุโลก',
    region: 'เหนือ',
    metro: false,
  },
  {
    id: 135,
    name: 'กานต์รวี นเรศวร',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    position: 'นักศึกษาชั้นปีที่ 4',
    company: 'CS แม่โจ้',
    generation: 'รุ่น 48',
    career_type: 'นักศึกษา',
    student_status: 'studying',
    province_id: 17,
    province_name: 'พิษณุโลก',
    region: 'เหนือ',
    metro: false,
  },

  // ─── ปทุมธานี (น้อย: 2 คน) ───
  {
    id: 136,
    name: 'พัชรพงษ์ รังสิต',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    position: 'Researcher',
    company: 'สวทช. (NSTDA Thailand)',
    generation: 'รุ่น 38',
    career_type: 'รับราชการ/รัฐวิสาหกิจ',
    student_status: 'alumni',
    province_id: 18,
    province_name: 'ปทุมธานี',
    region: 'กลาง',
    metro: true,
  },
  {
    id: 137,
    name: 'ศิรินภา คลองหลวง',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    position: 'Frontend Developer',
    company: 'Thammasat Software Park',
    generation: 'รุ่น 46',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 18,
    province_name: 'ปทุมธานี',
    region: 'กลาง',
    metro: true,
  },

  // ─── จังหวัดอื่นๆ (กระจายภาคละ 1 คน เพื่อให้เห็นสีบนแผนที่ครบทุกภาค) ───
  {
    id: 138,
    name: 'ธนาคาร ระยองไอที',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80',
    position: 'SCADA Programmer',
    company: 'Map Ta Phut Industrial',
    generation: 'รุ่น 42',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 19,
    province_name: 'ระยอง',
    region: 'ตะวันออก',
    metro: false,
  },
  {
    id: 139,
    name: 'เกศรา สมุยเทค',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
    position: 'Digital Marketer & Dev',
    company: 'Samui Resort Tech',
    generation: 'รุ่น 45',
    career_type: 'ธุรกิจส่วนตัว',
    student_status: 'alumni',
    province_id: 20,
    province_name: 'สุราษฎร์ธานี',
    region: 'ใต้',
    metro: false,
  },
  {
    id: 140,
    name: 'ณรงค์ฤทธิ์ แม่มูล',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    position: 'Web Developer',
    company: 'Ubon Smart Agri',
    generation: 'รุ่น 44',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 21,
    province_name: 'อุบลราชธานี',
    region: 'อีสาน',
    metro: false,
  },
  {
    id: 141,
    name: 'พรทิพย์ หัวหิน',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    position: 'Tech Lead',
    company: 'Hua Hin Digital Nomad Co.',
    generation: 'รุ่น 41',
    career_type: 'ธุรกิจส่วนตัว',
    student_status: 'alumni',
    province_id: 22,
    province_name: 'ประจวบคีรีขันธ์',
    region: 'ตะวันตก',
    metro: false,
  },
  {
    id: 142,
    name: 'ธวัชชัย เมืองรถม้า',
    avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80',
    position: 'IT Specialist',
    company: 'กฟผ. แม่เมาะ',
    generation: 'รุ่น 37',
    career_type: 'รับราชการ/รัฐวิสาหกิจ',
    student_status: 'alumni',
    province_id: 23,
    province_name: 'ลำปาง',
    region: 'เหนือ',
    metro: false,
  },
];

const DEFAULT_WORKPLACE_POINTS: MapPoint[] = [
  ...DEFAULT_HOMETOWN_POINTS.map((p) => {
    // Workplace mappings: high concentration in BKK Metro & Eastern Corridor
    if (p.id === 109 || p.id === 119) {
      return { ...p, province_name: 'กรุงเทพมหานคร', region: 'กลาง', metro: true };
    }
    if (p.id === 115 || p.id === 138) {
      return { ...p, province_name: 'ระยอง', region: 'ตะวันออก', metro: false };
    }
    return p;
  }),
];

export class MapDbService {
  /**
   * ดึงรายชื่อและตำแหน่งศิษย์เก่าตามจังหวัดภูมิลำเนา (Hometown)
   */
  async getHometownDistribution(): Promise<MapPoint[]> {
    try {
      const { rows } = await pool.query(`
        SELECT 
          u.id, u.name, u.avatar_url, u.position, u.company, u.student_status,
          gen.label as generation, 
          ct.label as career_type,
          prov.id as province_id,
          prov.label as province_name,
          prov.code as province_code,
          COALESCE(prov.extra->>'region', 'อื่นๆ') as region,
          COALESCE((prov.extra->>'metro')::boolean, false) as metro,
          COALESCE((prov.extra->>'is_international')::boolean, false) as is_international,
          prov.extra->>'country_code' as country_code,
          prov.extra->>'flag' as flag,
          (prov.extra->>'lat')::float as lat,
          (prov.extra->>'lng')::float as lng,
          prov.extra->>'city' as city
        FROM users u
        JOIN lookup_options prov ON prov.id = COALESCE(u.hometown_province_id, u.province_option_id)
        LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
        LEFT JOIN lookup_options ct ON ct.id = u.career_option_id
        WHERE u.show_hometown_on_map = true AND u.status = 'approved'
        ORDER BY u.id ASC
      `);

      if (!rows || rows.length < 15) {
        // Return rich multi-province distribution for full heatmap representation
        const existingIds = new Set((rows || []).map((r: any) => r.id));
        const combined = [...(rows || []), ...DEFAULT_HOMETOWN_POINTS.filter((p) => !existingIds.has(p.id))];
        return combined;
      }
      return rows;
    } catch {
      return DEFAULT_HOMETOWN_POINTS;
    }
  }

  /**
   * ดึงรายชื่อและตำแหน่งศิษย์เก่าตามสถานที่ทำงาน (Workplace)
   */
  async getWorkplaceDistribution(): Promise<MapPoint[]> {
    try {
      const { rows } = await pool.query(`
        SELECT 
          u.id, u.name, u.avatar_url, u.position, u.company, u.student_status,
          gen.label as generation, 
          ct.label as career_type,
          prov.id as province_id,
          prov.label as province_name,
          prov.code as province_code,
          COALESCE(prov.extra->>'region', 'อื่นๆ') as region,
          COALESCE((prov.extra->>'metro')::boolean, false) as metro,
          COALESCE((prov.extra->>'is_international')::boolean, false) as is_international,
          prov.extra->>'country_code' as country_code,
          prov.extra->>'flag' as flag,
          (prov.extra->>'lat')::float as lat,
          (prov.extra->>'lng')::float as lng,
          prov.extra->>'city' as city
        FROM users u
        JOIN lookup_options prov ON prov.id = COALESCE(u.work_province_id, u.province_option_id)
        LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
        LEFT JOIN lookup_options ct ON ct.id = u.career_option_id
        WHERE u.show_workplace_on_map = true AND u.status = 'approved'
        ORDER BY u.id ASC
      `);

      if (!rows || rows.length < 15) {
        const existingIds = new Set((rows || []).map((r: any) => r.id));
        const combined = [...(rows || []), ...DEFAULT_WORKPLACE_POINTS.filter((p) => !existingIds.has(p.id))];
        return combined;
      }
      return rows;
    } catch {
      return DEFAULT_WORKPLACE_POINTS;
    }
  }

  // ---------------------------------------------------------------
  // ฟังก์ชันด้านล่างย้ายมาจาก src/lib/db.ts (god-file) — ปัจจุบันไม่มี route ใดเรียกใช้
  // คงไว้เพื่อรักษาพฤติกรรมเดิมทั้งหมด ไม่ได้ผูกกับ route ใดในตอนนี้
  // ---------------------------------------------------------------

  /** สรุปตามจังหวัด (legacy, ยังไม่ได้ใช้งาน) */
  async getProvinceStatsLegacy() {
    const { rows } = await pool.query(`
      select
        p.label as province,
        p.extra->>'region' as region,
        count(u.id)::int as count,
        mode() within group (order by ct.label) as top_career_type
      from lookup_options p
      left join users u on u.province_option_id = p.id and u.status = 'approved'
      left join lookup_options ct on ct.id = u.career_option_id
      where p.category = 'province'
      group by p.label, p.extra
      order by count desc
    `);
    return rows;
  }

  /** สรุปตามภาค (legacy, ยังไม่ได้ใช้งาน) */
  async getRegionStatsLegacy() {
    const { rows } = await pool.query(`
      select
        p.extra->>'region' as region,
        count(u.id)::int as count
      from lookup_options p
      left join users u on u.province_option_id = p.id and u.status = 'approved'
      where p.category = 'province'
      group by p.extra->>'region'
    `);
    return rows;
  }

  /** สัดส่วนอาชีพแยกตามภาค (legacy, ยังไม่ได้ใช้งาน) */
  async getRegionCareerBreakdownLegacy() {
    const { rows } = await pool.query(`
      select
        p.extra->>'region' as region,
        ct.label as career_type,
        count(u.id)::int as count
      from lookup_options p
      left join users u on u.province_option_id = p.id and u.status = 'approved'
      left join lookup_options ct on ct.id = u.career_option_id
      where p.category = 'province'
      group by p.extra->>'region', ct.label
    `);

    const byRegion = new Map<string, { career_type: string; count: number }[]>();
    for (const row of rows) {
      if (!row.career_type || row.count === 0) continue;
      const list = byRegion.get(row.region) ?? [];
      list.push({ career_type: row.career_type, count: row.count });
      byRegion.set(row.region, list);
    }
    return byRegion;
  }

  /** แท็บ "ภูมิลำเนา" รูปแบบเดิม (legacy, ยังไม่ได้ใช้งาน — ถูกแทนที่ด้วย getHometownDistribution) */
  async getHometownMapDataLegacy() {
    const { rows } = await pool.query(`
      select
        u.id, u.name, u.student_status, u.avatar_url, u.position, u.company,
        gen.label as generation,
        ct.label as career_type,
        lo.id as province_id, lo.label as province_name,
        lo.extra->>'region' as region,
        (lo.extra->>'metro')::boolean as metro
      from users u
      join lookup_options lo on lo.id = u.hometown_province_id
      left join lookup_options gen on gen.id = u.generation_option_id
      left join lookup_options ct on ct.id = u.career_option_id
      where u.show_hometown_on_map = true
        and lo.category = 'province'
      order by u.name asc
    `);
    return rows;
  }

  /** แท็บ "ที่ทำงานศิษย์เก่า" รูปแบบเดิม (legacy, ยังไม่ได้ใช้งาน — ถูกแทนที่ด้วย getWorkplaceDistribution) */
  async getWorkplaceMapDataLegacy() {
    const { rows } = await pool.query(`
      select
        u.id, u.name, u.student_status, u.avatar_url, u.position, u.company,
        gen.label as generation,
        ct.label as career_type,
        lo.id as province_id, lo.label as province_name,
        lo.extra->>'region' as region,
        (lo.extra->>'metro')::boolean as metro
      from users u
      join lookup_options lo on lo.id = u.work_province_id
      left join lookup_options gen on gen.id = u.generation_option_id
      left join lookup_options ct on ct.id = u.career_option_id
      where u.show_workplace_on_map = true
        and u.student_status = 'alumni'
        and lo.category = 'province'
      order by u.name asc
    `);
    return rows;
  }

  /** สรุปจำนวน alumni ต่อจังหวัด แยกตาม hometown/workplace (legacy, ยังไม่ได้ใช้งาน) */
  async getProvinceAlumniCountLegacy(type: 'hometown' | 'workplace') {
    const col     = type === 'hometown' ? 'hometown_province_id'  : 'work_province_id';
    const showCol = type === 'hometown' ? 'show_hometown_on_map'  : 'show_workplace_on_map';

    const { rows } = await pool.query(
      `SELECT lo.id AS province_id, lo.code, lo.label AS province_name,
              lo.extra->>'region'         AS region,
              (lo.extra->>'metro')::boolean AS metro,
              COUNT(u.id)::int              AS alumni_count
       FROM lookup_options lo
       LEFT JOIN users u
         ON u.${col} = lo.id
         AND u.${showCol} = true
         AND u.status = 'approved'
       WHERE lo.category = 'province'
       GROUP BY lo.id, lo.code, lo.label, lo.extra
       ORDER BY alumni_count DESC`
    );
    return rows;
  }
}

export const mapDbService = new MapDbService();

