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
}

const DEFAULT_HOMETOWN_POINTS: MapPoint[] = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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
    id: 4,
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
    id: 5,
    name: 'ธิดารัตน์ วิเศษศิลป์',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    position: 'นักศึกษาชั้นปีที่ 4',
    company: 'มหาวิทยาลัยแม่โจ้',
    generation: 'รุ่น 48',
    career_type: 'นักศึกษา',
    student_status: 'studying',
    province_id: 4,
    province_name: 'ชลบุรี',
    region: 'ตะวันออก',
    metro: false,
  },
];

const DEFAULT_WORKPLACE_POINTS: MapPoint[] = [
  {
    id: 1,
    name: 'สมชาย ใจดี',
    avatar_url: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=600&q=80',
    position: 'Senior Developer',
    company: 'Agoda (Thailand)',
    generation: 'รุ่น 43',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 2,
    province_name: 'กรุงเทพมหานคร',
    region: 'กลาง',
    metro: true,
  },
  {
    id: 2,
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
    id: 3,
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
    id: 4,
    name: 'กิตติศักดิ์ แซ่ลิ้ม',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    position: 'Security Engineer',
    company: 'KBTG',
    generation: 'รุ่น 45',
    career_type: 'เอกชน',
    student_status: 'alumni',
    province_id: 2,
    province_name: 'นนทบุรี',
    region: 'กลาง',
    metro: true,
  },
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
          COALESCE(prov.extra->>'region', 'อื่นๆ') as region,
          COALESCE((prov.extra->>'metro')::boolean, false) as metro
        FROM users u
        JOIN lookup_options prov ON prov.id = u.hometown_province_id
        LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
        LEFT JOIN lookup_options ct ON ct.id = u.career_option_id
        WHERE u.show_hometown_on_map = true AND u.status = 'approved'
        ORDER BY u.id ASC
      `);

      if (rows.length === 0) {
        return DEFAULT_HOMETOWN_POINTS;
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
          COALESCE(prov.extra->>'region', 'อื่นๆ') as region,
          COALESCE((prov.extra->>'metro')::boolean, false) as metro
        FROM users u
        JOIN lookup_options prov ON prov.id = u.work_province_id
        LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
        LEFT JOIN lookup_options ct ON ct.id = u.career_option_id
        WHERE u.show_workplace_on_map = true AND u.status = 'approved'
        ORDER BY u.id ASC
      `);

      if (rows.length === 0) {
        return DEFAULT_WORKPLACE_POINTS;
      }
      return rows;
    } catch {
      return DEFAULT_WORKPLACE_POINTS;
    }
  }
}

export const mapDbService = new MapDbService();
