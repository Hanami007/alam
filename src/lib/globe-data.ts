/**
 * Globe Data - CSMJU Global Constellation
 * Mock data สำหรับลูกโลก 3 มิติ แสดงการกระจายตัวของศิษย์เก่า CSMJU ทั่วโลก
 */

export interface GlobeAlumni {
  id: number;
  name: string;
  avatar_url?: string;
  position?: string;
  company?: string;
  generation?: string;
  career_type?: string;
  country_code: string;
  country_name: string;
  city: string;
  lat: number;
  lng: number;
  student_status: 'alumni' | 'student';
}

export interface GlobeCountryCluster {
  country_code: string;
  country_name: string;
  city: string;
  lat: number;
  lng: number;
  count: number;
  flag: string;
  alumni: GlobeAlumni[];
  region: 'thailand' | 'asia' | 'americas' | 'europe' | 'oceania' | 'middleeast';
}

export interface GlobeArc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
  label: string;
  altitude?: number;
}

export interface GlobeRegionNav {
  key: string;
  label: string;
  flag: string;
  lat: number;
  lng: number;
  altitude: number;
}

// จุดกำเนิด: มหาวิทยาลัยแม่โจ้ เชียงใหม่
export const MAEJO_ORIGIN = {
  lat: 18.896,
  lng: 98.956,
  name: 'มหาวิทยาลัยแม่โจ้',
  city: 'เชียงใหม่',
  country: 'ไทย',
};

const COUNTRY_FLAGS: Record<string, string> = {
  TH: '🇹🇭', JP: '🇯🇵', SG: '🇸🇬', US: '🇺🇸', AU: '🇦🇺',
  DE: '🇩🇪', GB: '🇬🇧', CA: '🇨🇦', KR: '🇰🇷', NL: '🇳🇱',
  FR: '🇫🇷', CH: '🇨🇭', AE: '🇦🇪', CN: '🇨🇳', TW: '🇹🇼',
};

const COUNTRY_REGIONS: Record<string, GlobeCountryCluster['region']> = {
  TH: 'thailand',
  JP: 'asia', SG: 'asia', KR: 'asia', CN: 'asia', TW: 'asia',
  US: 'americas', CA: 'americas',
  AU: 'oceania',
  DE: 'europe', GB: 'europe', NL: 'europe', FR: 'europe', CH: 'europe',
  AE: 'middleeast',
};

const ARC_COLORS: Record<GlobeCountryCluster['region'], string> = {
  thailand:   'rgba(99,  102, 241, 0.8)',
  asia:       'rgba(20,  184, 166, 0.8)',
  americas:   'rgba(245, 158,  11, 0.8)',
  europe:     'rgba(168,  85, 247, 0.8)',
  oceania:    'rgba( 34, 197,  94, 0.8)',
  middleeast: 'rgba(239,  68,  68, 0.8)',
};

// ─── Mock Alumni Data (40+ คน, 15 ประเทศ) ─────────────────────────────────────
const MOCK_ALUMNI: GlobeAlumni[] = [
  // ─── ประเทศไทย ─ กรุงเทพฯ ──────────────────────────────────────────────────
  { id: 1001, name: 'สมหญิง รักเรียน',   avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80', position: 'Lead AI Scientist',       company: 'SCB TechX',           generation: 'รุ่น 44', career_type: 'เอกชน',    country_code: 'TH', country_name: 'ประเทศไทย', city: 'กรุงเทพฯ',    lat: 13.7563,  lng: 100.5018,  student_status: 'alumni' },
  { id: 1002, name: 'วีระ สงวนพงษ์',     avatar_url: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=200&q=80', position: 'Senior Backend Eng.',    company: 'Agoda',               generation: 'รุ่น 43', career_type: 'เอกชน',    country_code: 'TH', country_name: 'ประเทศไทย', city: 'กรุงเทพฯ',    lat: 13.7563,  lng: 100.5018,  student_status: 'alumni' },
  { id: 1003, name: 'นภาพร ศรีทอง',      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', position: 'Mobile App Developer',   company: 'LINE Thailand',       generation: 'รุ่น 45', career_type: 'เอกชน',    country_code: 'TH', country_name: 'ประเทศไทย', city: 'กรุงเทพฯ',    lat: 13.7563,  lng: 100.5018,  student_status: 'alumni' },
  { id: 1004, name: 'ชัยณรงค์ พิทักษ์',  position: 'DevOps Engineer',            company: 'Shopee Thailand',     generation: 'รุ่น 44', career_type: 'เอกชน',    country_code: 'TH', country_name: 'ประเทศไทย', city: 'กรุงเทพฯ',    lat: 13.7563,  lng: 100.5018,  student_status: 'alumni' },
  { id: 1005, name: 'อภิชาติ ธรรมะ',     position: 'Data Engineer',              company: 'KBTG (กสิกรไทย)',    generation: 'รุ่น 46', career_type: 'เอกชน',    country_code: 'TH', country_name: 'ประเทศไทย', city: 'กรุงเทพฯ',    lat: 13.7563,  lng: 100.5018,  student_status: 'alumni' },
  { id: 1006, name: 'ปริยา สุขสมบัติ',   position: 'UX Designer',                company: 'True Digital',        generation: 'รุ่น 45', career_type: 'เอกชน',    country_code: 'TH', country_name: 'ประเทศไทย', city: 'กรุงเทพฯ',    lat: 13.7563,  lng: 100.5018,  student_status: 'alumni' },
  { id: 1007, name: 'กิตติพงษ์ ล้านนา',  position: 'Full Stack Developer',       company: 'Wongnai Media',       generation: 'รุ่น 43', career_type: 'เอกชน',    country_code: 'TH', country_name: 'ประเทศไทย', city: 'กรุงเทพฯ',    lat: 13.7563,  lng: 100.5018,  student_status: 'alumni' },
  { id: 1008, name: 'สุพรรณิกา วงค์แก้ว', position: 'Cybersecurity Analyst',    company: 'NT (TOT)',            generation: 'รุ่น 42', career_type: 'รัฐบาล',   country_code: 'TH', country_name: 'ประเทศไทย', city: 'กรุงเทพฯ',    lat: 13.7563,  lng: 100.5018,  student_status: 'alumni' },
  { id: 1009, name: 'ธนกร ล้านช้าง',     position: 'Software Engineer',          company: 'AMATA (นิคมอมตะ)',   generation: 'รุ่น 44', career_type: 'เอกชน',    country_code: 'TH', country_name: 'ประเทศไทย', city: 'ชลบุรี',      lat: 13.3611,  lng: 100.9847,  student_status: 'alumni' },
  { id: 1010, name: 'รัตนา พงษ์เกษตร',   position: 'IoT Engineer',               company: 'WHA Industrial',      generation: 'รุ่น 45', career_type: 'เอกชน',    country_code: 'TH', country_name: 'ประเทศไทย', city: 'ระยอง',       lat: 12.6814,  lng: 101.2816,  student_status: 'alumni' },
  { id: 1011, name: 'พิเชษฐ์ คงสมบัติ',  position: 'System Analyst',             company: 'มช.',                 generation: 'รุ่น 41', career_type: 'การศึกษา', country_code: 'TH', country_name: 'ประเทศไทย', city: 'เชียงใหม่',   lat: 18.7883,  lng: 98.9853,   student_status: 'alumni' },
  { id: 1012, name: 'เกศนี วัฒนา',        position: 'Instructor',                 company: 'มหาวิทยาลัยแม่โจ้',  generation: 'รุ่น 39', career_type: 'การศึกษา', country_code: 'TH', country_name: 'ประเทศไทย', city: 'เชียงใหม่',   lat: 18.896,   lng: 98.956,    student_status: 'alumni' },
  { id: 1013, name: 'วิทวัส บุตรดี',      position: 'Cloud Architect',            company: 'AWS Thailand',        generation: 'รุ่น 43', career_type: 'เอกชน',    country_code: 'TH', country_name: 'ประเทศไทย', city: 'กรุงเทพฯ',    lat: 13.7563,  lng: 100.5018,  student_status: 'alumni' },
  { id: 1014, name: 'ศุภลักษณ์ เชียงตุง', position: 'AI Product Manager',        company: 'DTAC Truecorp',       generation: 'รุ่น 44', career_type: 'เอกชน',    country_code: 'TH', country_name: 'ประเทศไทย', city: 'กรุงเทพฯ',    lat: 13.7563,  lng: 100.5018,  student_status: 'alumni' },
  { id: 1015, name: 'ปัณฑิตา สาระ',       position: 'Startup Founder / CTO',     company: 'FarmTech AI',         generation: 'รุ่น 45', career_type: 'ธุรกิจ',   country_code: 'TH', country_name: 'ประเทศไทย', city: 'เชียงใหม่',   lat: 18.7883,  lng: 98.9853,   student_status: 'alumni' },

  // ─── ญี่ปุ่น ────────────────────────────────────────────────────────────────
  { id: 2001, name: 'สิทธิชัย คงดำรง',   avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', position: 'Software Engineer',   company: 'Rakuten',             generation: 'รุ่น 43', career_type: 'เอกชน', country_code: 'JP', country_name: 'ญี่ปุ่น',          city: 'โตเกียว',   lat: 35.6762,  lng: 139.6503, student_status: 'alumni' },
  { id: 2002, name: 'มาริษา โชติกะ',     avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', position: 'Game Developer',      company: 'Bandai Namco',        generation: 'รุ่น 44', career_type: 'เอกชน', country_code: 'JP', country_name: 'ญี่ปุ่น',          city: 'โตเกียว',   lat: 35.6762,  lng: 139.6503, student_status: 'alumni' },
  { id: 2003, name: 'บุรีรัมย์ ขจัดภัย', position: 'ML Researcher',             company: 'RIKEN Center for AI', generation: 'รุ่น 42', career_type: 'วิจัย',    country_code: 'JP', country_name: 'ญี่ปุ่น',          city: 'โอซาก้า',   lat: 34.6937,  lng: 135.5023, student_status: 'alumni' },

  // ─── สิงคโปร์ ───────────────────────────────────────────────────────────────
  { id: 3001, name: 'ทิพย์สุดา ประทีป',  avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80', position: 'Cloud Architect',     company: 'AWS (SEA)',           generation: 'รุ่น 42', career_type: 'เอกชน', country_code: 'SG', country_name: 'สิงคโปร์',         city: 'สิงคโปร์',  lat: 1.3521,   lng: 103.8198, student_status: 'alumni' },
  { id: 3002, name: 'นเรศ ศักดิ์สูง',    position: 'Quant Analyst',             company: 'DBS Bank Tech',       generation: 'รุ่น 43', career_type: 'เอกชน',    country_code: 'SG', country_name: 'สิงคโปร์',         city: 'สิงคโปร์',  lat: 1.3521,   lng: 103.8198, student_status: 'alumni' },
  { id: 3003, name: 'ศิรินภา เลิศวิไล',  position: 'Frontend Engineer',         company: 'Sea Group (Shopee)',  generation: 'รุ่น 45', career_type: 'เอกชน',    country_code: 'SG', country_name: 'สิงคโปร์',         city: 'สิงคโปร์',  lat: 1.3521,   lng: 103.8198, student_status: 'alumni' },

  // ─── สหรัฐอเมริกา ─────────────────────────────────────────────────────────
  { id: 4001, name: 'ปิยะ เชิดชูชัย',    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80', position: 'Senior SWE',          company: 'Google',              generation: 'รุ่น 41', career_type: 'เอกชน',    country_code: 'US', country_name: 'สหรัฐอเมริกา', city: 'Silicon Valley', lat: 37.3382, lng: -121.8863, student_status: 'alumni' },
  { id: 4002, name: 'กัลยา เพิ่มพูน',    position: 'ML Engineer',               company: 'Microsoft Azure AI', generation: 'รุ่น 42', career_type: 'เอกชน',    country_code: 'US', country_name: 'สหรัฐอเมริกา', city: 'Seattle',        lat: 47.6062, lng: -122.3321, student_status: 'alumni' },
  { id: 4003, name: 'อรรถสิทธิ์ บำรุงรักษ์', position: 'PhD. Computer Science', company: 'MIT CSAIL',          generation: 'รุ่น 43', career_type: 'การศึกษา', country_code: 'US', country_name: 'สหรัฐอเมริกา', city: 'Boston',         lat: 42.3601, lng: -71.0589,  student_status: 'alumni' },
  { id: 4004, name: 'ณัฐวุฒิ ก้าวหน้า',  position: 'Software Engineer',         company: 'Meta (Facebook)',    generation: 'รุ่น 44', career_type: 'เอกชน',    country_code: 'US', country_name: 'สหรัฐอเมริกา', city: 'Silicon Valley', lat: 37.3382, lng: -121.8863, student_status: 'alumni' },

  // ─── ออสเตรเลีย ────────────────────────────────────────────────────────────
  { id: 5001, name: 'สรายุทธ ดวงจันทร์',  avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', position: 'Full-Stack Dev',     company: 'Canva',               generation: 'รุ่น 44', career_type: 'เอกชน',    country_code: 'AU', country_name: 'ออสเตรเลีย', city: 'ซิดนีย์',    lat: -33.8688, lng: 151.2093, student_status: 'alumni' },
  { id: 5002, name: 'วิมลรัตน์ ทองดี',    position: 'MSc. AI & Robotics',       company: 'Uni. of Melbourne',  generation: 'รุ่น 45', career_type: 'การศึกษา', country_code: 'AU', country_name: 'ออสเตรเลีย', city: 'เมลเบิร์น',  lat: -37.8136, lng: 144.9631, student_status: 'alumni' },

  // ─── เยอรมนี ────────────────────────────────────────────────────────────────
  { id: 6001, name: 'ฐิติพันธ์ มงคลสวัสดิ์', position: 'Embedded Systems Eng.', company: 'BMW Group Tech',     generation: 'รุ่น 43', career_type: 'เอกชน',    country_code: 'DE', country_name: 'เยอรมนี',     city: 'มิวนิก',     lat: 48.1351,  lng: 11.5820,  student_status: 'alumni' },
  { id: 6002, name: 'ชนัดดา ชลธี',          position: 'PhD. HCI',               company: 'TU Munich (TUM)',    generation: 'รุ่น 44', career_type: 'การศึกษา', country_code: 'DE', country_name: 'เยอรมนี',     city: 'มิวนิก',     lat: 48.1351,  lng: 11.5820,  student_status: 'alumni' },

  // ─── สหราชอาณาจักร ─────────────────────────────────────────────────────────
  { id: 7001, name: 'เพชร ลาภเกิด',         position: 'Software Engineer',      company: 'Revolut',            generation: 'รุ่น 43', career_type: 'เอกชน',    country_code: 'GB', country_name: 'สหราชอาณาจักร', city: 'ลอนดอน',    lat: 51.5074,  lng: -0.1278,  student_status: 'alumni' },

  // ─── แคนาดา ─────────────────────────────────────────────────────────────────
  { id: 8001, name: 'ธิดารัตน์ เรืองราช',    position: 'Data Scientist',         company: 'Shopify',            generation: 'รุ่น 44', career_type: 'เอกชน',    country_code: 'CA', country_name: 'แคนาดา',      city: 'โตรอนโต',    lat: 43.6532,  lng: -79.3832, student_status: 'alumni' },

  // ─── เกาหลีใต้ ─────────────────────────────────────────────────────────────
  { id: 9001, name: 'วัชระ นาคสวัสดิ์',      position: 'Software Engineer',     company: 'Samsung Electronics', generation: 'รุ่น 45', career_type: 'เอกชน',   country_code: 'KR', country_name: 'เกาหลีใต้',   city: 'โซล',        lat: 37.5665,  lng: 126.9780, student_status: 'alumni' },
  { id: 9002, name: 'ภัทรา เก่งกาจ',         position: 'UX Researcher',         company: 'LG Electronics',     generation: 'รุ่น 44', career_type: 'เอกชน',    country_code: 'KR', country_name: 'เกาหลีใต้',   city: 'โซล',        lat: 37.5665,  lng: 126.9780, student_status: 'alumni' },

  // ─── เนเธอร์แลนด์ ─────────────────────────────────────────────────────────
  { id: 10001, name: 'ชินดิส เรืองธรรม',     position: 'Cloud Engineer',        company: 'ASML',               generation: 'รุ่น 43', career_type: 'เอกชน',    country_code: 'NL', country_name: 'เนเธอร์แลนด์', city: 'อัมสเตอร์ดัม', lat: 52.3676, lng: 4.9041,   student_status: 'alumni' },

  // ─── ฝรั่งเศส ─────────────────────────────────────────────────────────────
  { id: 11001, name: 'ยุวดี แสงจันทร์',      position: 'AI Research Intern',    company: 'Inria',              generation: 'รุ่น 46', career_type: 'วิจัย',    country_code: 'FR', country_name: 'ฝรั่งเศส',    city: 'ปารีส',      lat: 48.8566,  lng: 2.3522,   student_status: 'alumni' },

  // ─── สวิตเซอร์แลนด์ ───────────────────────────────────────────────────────
  { id: 12001, name: 'สมศักดิ์ วิเชียรรัตน์', position: 'Software Engineer',   company: 'CERN',               generation: 'รุ่น 42', career_type: 'วิจัย',    country_code: 'CH', country_name: 'สวิตเซอร์แลนด์', city: 'เจนีวา',  lat: 46.2044,  lng: 6.1432,   student_status: 'alumni' },

  // ─── ยูเออี / ดูไบ ─────────────────────────────────────────────────────────
  { id: 13001, name: 'ธนัช ทรงชัย',           position: 'IT Manager',           company: 'Emirates Airlines IT', generation: 'รุ่น 43', career_type: 'เอกชน',  country_code: 'AE', country_name: 'สหรัฐอาหรับฯ',  city: 'ดูไบ',      lat: 25.2048,  lng: 55.2708,  student_status: 'alumni' },

  // ─── จีน ─────────────────────────────────────────────────────────────────
  { id: 14001, name: 'ปิติพล ทรัพย์สมบูรณ์',  position: 'Tech Lead',            company: 'Tencent Cloud (APAC)', generation: 'รุ่น 42', career_type: 'เอกชน', country_code: 'CN', country_name: 'จีน',           city: 'เซินเจิ้น',  lat: 22.5431,  lng: 114.0579, student_status: 'alumni' },

  // ─── ไต้หวัน ─────────────────────────────────────────────────────────────
  { id: 15001, name: 'ณัฐพงษ์ สิทธิชัย',      position: 'Hardware Engineer',    company: 'TSMC',               generation: 'รุ่น 44', career_type: 'เอกชน',    country_code: 'TW', country_name: 'ไต้หวัน',      city: 'ไทเป',       lat: 25.0330,  lng: 121.5654, student_status: 'alumni' },
];

// ─── Build Country Clusters ───────────────────────────────────────────────────
function buildClusters(alumni: GlobeAlumni[]): GlobeCountryCluster[] {
  const map = new Map<string, GlobeCountryCluster>();
  for (const a of alumni) {
    const key = `${a.country_code}::${a.city}`;
    if (!map.has(key)) {
      map.set(key, {
        country_code: a.country_code,
        country_name: a.country_name,
        city: a.city,
        lat: a.lat,
        lng: a.lng,
        count: 0,
        flag: COUNTRY_FLAGS[a.country_code] ?? '🌐',
        alumni: [],
        region: COUNTRY_REGIONS[a.country_code] ?? 'asia',
      });
    }
    const c = map.get(key)!;
    c.alumni.push(a);
    c.count++;
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

// ─── Build Arcs from Maejo → each cluster ────────────────────────────────────
function buildArcs(clusters: GlobeCountryCluster[]): GlobeArc[] {
  return clusters
    .filter((c) => !(c.country_code === 'TH' && c.city === 'เชียงใหม่' && c.count < 3))
    .map((c) => ({
      startLat: MAEJO_ORIGIN.lat,
      startLng: MAEJO_ORIGIN.lng,
      endLat: c.lat,
      endLng: c.lng,
      color: ARC_COLORS[c.region],
      label: `${c.flag} ${c.city} (${c.count} คน)`,
      altitude: c.count >= 8 ? 0.4 : c.count >= 4 ? 0.3 : 0.22,
    }));
}

export const GLOBE_CLUSTERS = buildClusters(MOCK_ALUMNI);
export const GLOBE_ARCS = buildArcs(GLOBE_CLUSTERS);
export const TOTAL_ALUMNI_COUNT = MOCK_ALUMNI.length;
export const ALL_ALUMNI = MOCK_ALUMNI;

// ─── Region Navigation ────────────────────────────────────────────────────────
export const GLOBE_REGION_NAVS: GlobeRegionNav[] = [
  { key: 'all',        label: 'หมุนอัตโนมัติ', flag: '🌐', lat: 13.0,  lng: 101.0,  altitude: 2.0 },
  { key: 'thailand',   label: 'ไทย (บ้านเกิด)', flag: '🇹🇭', lat: 13.0, lng: 101.0,  altitude: 1.2 },
  { key: 'asia',       label: 'เอเชียแปซิฟิก',  flag: '🌏', lat: 23.0,  lng: 115.0,  altitude: 1.8 },
  { key: 'americas',   label: 'อเมริกา',          flag: '🇺🇸', lat: 40.0, lng: -100.0, altitude: 2.0 },
  { key: 'europe',     label: 'ยุโรป',             flag: '🇪🇺', lat: 51.0, lng: 10.0,   altitude: 1.8 },
  { key: 'oceania',    label: 'โอเชียเนีย',        flag: '🇦🇺', lat: -25.0,lng: 134.0,  altitude: 2.0 },
  { key: 'middleeast', label: 'ตะวันออกกลาง',     flag: '🌍', lat: 25.0,  lng: 50.0,   altitude: 1.8 },
];
