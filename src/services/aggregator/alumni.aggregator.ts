import { apimju } from '../apimju/client';
import { MjuStudent } from '../apimju/types';
import { pool } from '@/lib/db';

export interface UnifiedAlumniProfile {
  id: number | string;
  studentId: string;
  name: string;
  prefix?: string;
  faculty: string;
  department: string;
  generation: string;
  generationNumber: number;
  admissionYear: number;
  graduationYear?: number;
  status: string;
  studentStatus: string;
  position?: string;
  company?: string;
  careerType?: string;
  province?: string;
  bio?: string;
  avatarUrl: string;
  totalPoints: number;
  isRegisteredUser: boolean;
}

export class AlumniAggregatorService {
  /**
   * รวมข้อมูลนักศึกษา/ศิษย์เก่าระหว่าง apimju (Master Academic DB) และ Local Core DB (Community/Karma DB)
   */
  async getUnifiedAlumniList(params: {
    query?: string;
    generation?: string;
    province?: string;
    careerType?: string;
  } = {}): Promise<UnifiedAlumniProfile[]> {
    // 1. ดึงข้อมูลนักศึกษาจาก apimju
    const mjuStudents = await apimju.searchStudents({
      query: params.query,
      generation: params.generation,
    });

    // 2. ดึงข้อมูลผู้ใช้ในระบบท้องถิ่น (Local DB) ที่ลงทะเบียนแล้ว
    const { rows: dbUsers } = await pool.query(`
      SELECT 
        u.id, u.student_id, u.name, u.role, u.status, u.student_status,
        u.total_points, u.avatar_url, u.company, u.position, u.bio,
        gen.label as generation,
        prov.label as province,
        ct.label as career_type
      FROM users u
      LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
      LEFT JOIN lookup_options prov ON prov.id = u.province_option_id
      LEFT JOIN lookup_options ct ON ct.id = u.career_option_id
      WHERE u.status = 'approved'
    `);

    const dbUserMap = new Map<string, any>();
    for (const u of dbUsers) {
      if (u.student_id) {
        dbUserMap.set(u.student_id, u);
      }
    }

    // 3. ผสาน (Merge) ข้อมูลทั้งสองส่วน
    const unifiedList: UnifiedAlumniProfile[] = [];

    // เพิ่มนักศึกษาจาก apimju พร้อมข้อมูลเสริมจาก Local DB
    for (const student of mjuStudents) {
      const dbUser = dbUserMap.get(student.studentId);

      const unified: UnifiedAlumniProfile = {
        id: dbUser?.id || `mju-${student.studentId}`,
        studentId: student.studentId,
        name: dbUser?.name || student.fullNameTh,
        prefix: student.prefixTh,
        faculty: student.faculty,
        department: student.department,
        generation: student.generation,
        generationNumber: student.generationNumber,
        admissionYear: student.admissionYear,
        graduationYear: student.graduationYear,
        status: student.status,
        studentStatus: dbUser?.student_status || (student.status === 'studying' ? 'studying' : 'alumni'),
        position: dbUser?.position || 'ศิษย์เก่า / บุคลากร',
        company: dbUser?.company || 'มหาวิทยาลัยแม่โจ้',
        careerType: dbUser?.career_type || 'ทั่วไป',
        province: dbUser?.province || 'เชียงใหม่',
        bio: dbUser?.bio || `นักศึกษา/ศิษย์เก่าหลักสูตร ${student.program}`,
        avatarUrl: dbUser?.avatar_url || student.avatarUrl || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=600&q=80',
        totalPoints: dbUser?.total_points || 0,
        isRegisteredUser: !!dbUser,
      };

      // ฟิลเตอร์เสริม province / careerType
      if (params.province && unified.province !== params.province) continue;
      if (params.careerType && unified.careerType !== params.careerType) continue;

      unifiedList.push(unified);
    }

    return unifiedList;
  }

  /**
   * ดึงข้อมูลศิษย์เก่าแบบละเอียดรายคน
   */
  async getUnifiedProfileById(studentIdOrDbId: string | number): Promise<UnifiedAlumniProfile | null> {
    let studentId = typeof studentIdOrDbId === 'string' ? studentIdOrDbId : '';
    let dbUser: any = null;

    if (typeof studentIdOrDbId === 'number' || !isNaN(Number(studentIdOrDbId))) {
      const { rows } = await pool.query(`
        SELECT 
          u.id, u.student_id, u.name, u.role, u.status, u.student_status,
          u.total_points, u.avatar_url, u.company, u.position, u.bio,
          gen.label as generation,
          prov.label as province,
          ct.label as career_type
        FROM users u
        LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
        LEFT JOIN lookup_options prov ON prov.id = u.province_option_id
        LEFT JOIN lookup_options ct ON ct.id = u.career_option_id
        WHERE u.id = $1
      `, [Number(studentIdOrDbId)]);
      dbUser = rows[0] || null;
      if (dbUser?.student_id) studentId = dbUser.student_id;
    }

    const mjuStudent = studentId ? await apimju.getStudentById(studentId) : null;

    if (!dbUser && !mjuStudent) return null;

    return {
      id: dbUser?.id || `mju-${studentId}`,
      studentId: studentId || dbUser?.student_id || '',
      name: dbUser?.name || mjuStudent?.fullNameTh || 'ไม่ระบุชื่อ',
      prefix: mjuStudent?.prefixTh,
      faculty: mjuStudent?.faculty || 'วิทยาศาสตร์',
      department: mjuStudent?.department || 'วิทยาการคอมพิวเตอร์',
      generation: mjuStudent?.generation || dbUser?.generation || 'รุ่น 43',
      generationNumber: mjuStudent?.generationNumber || 43,
      admissionYear: mjuStudent?.admissionYear || 2560,
      graduationYear: mjuStudent?.graduationYear || 2564,
      status: mjuStudent?.status || 'alumni',
      studentStatus: dbUser?.student_status || (mjuStudent?.status === 'studying' ? 'studying' : 'alumni'),
      position: dbUser?.position || 'ศิษย์เก่า',
      company: dbUser?.company || '',
      careerType: dbUser?.career_type || 'ทั่วไป',
      province: dbUser?.province || 'เชียงใหม่',
      bio: dbUser?.bio || '',
      avatarUrl: dbUser?.avatar_url || mjuStudent?.avatarUrl || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=600&q=80',
      totalPoints: dbUser?.total_points || 0,
      isRegisteredUser: !!dbUser,
    };
  }
}

export const alumniAggregator = new AlumniAggregatorService();
