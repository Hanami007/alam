import { MjuStudent, MjuSearchParams } from './types';

/**
 * Mock university student & alumni dataset for development & testing.
 * When APIMJU_BASE_URL is defined, the client will call the real MJU API.
 */
const MOCK_MJU_STUDENTS: MjuStudent[] = [
  {
    studentId: '60010001',
    citizenIdLast4: '1234',
    prefixTh: 'นาย',
    firstNameTh: 'สมชาย',
    lastNameTh: 'ใจดี',
    fullNameTh: 'สมชาย ใจดี',
    fullNameEn: 'Somchai Jaidee',
    email: 'somchai.j@mju.ac.th',
    phone: '081-222-3456',
    faculty: 'วิทยาศาสตร์',
    department: 'วิทยาการคอมพิวเตอร์',
    program: 'วท.บ. วิทยาการคอมพิวเตอร์',
    generation: 'รุ่น 43',
    generationNumber: 43,
    admissionYear: 2560,
    graduationYear: 2564,
    status: 'alumni',
    avatarUrl: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=600&q=80',
  },
  {
    studentId: '63010002',
    citizenIdLast4: '5678',
    prefixTh: 'นางสาว',
    firstNameTh: 'สมหญิง',
    lastNameTh: 'รักเรียน',
    fullNameTh: 'สมหญิง รักเรียน',
    fullNameEn: 'Somying Rakrian',
    email: 'somying.r@mju.ac.th',
    phone: '089-111-2233',
    faculty: 'วิทยาศาสตร์',
    department: 'วิทยาการคอมพิวเตอร์',
    program: 'วท.บ. วิทยาการคอมพิวเตอร์',
    generation: 'รุ่น 46',
    generationNumber: 46,
    admissionYear: 2563,
    graduationYear: 2567,
    status: 'alumni',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
  },
  {
    studentId: '60010003',
    citizenIdLast4: '9012',
    prefixTh: 'นาย',
    firstNameTh: 'สมศักดิ์',
    lastNameTh: 'มั่นคง',
    fullNameTh: 'สมศักดิ์ มั่นคง',
    fullNameEn: 'Somsak Mankong',
    email: 'somsak.m@mju.ac.th',
    phone: '084-555-6677',
    faculty: 'วิทยาศาสตร์',
    department: 'วิทยาการคอมพิวเตอร์',
    program: 'วท.บ. วิทยาการคอมพิวเตอร์',
    generation: 'รุ่น 43',
    generationNumber: 43,
    admissionYear: 2560,
    graduationYear: 2564,
    status: 'alumni',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
  },
  {
    studentId: '65010004',
    citizenIdLast4: '3456',
    prefixTh: 'นางสาว',
    firstNameTh: 'ธิดารัตน์',
    lastNameTh: 'วิเศษศิลป์',
    fullNameTh: 'ธิดารัตน์ วิเศษศิลป์',
    fullNameEn: 'Thidarat Wisetsin',
    email: 'thidarat.w@mju.ac.th',
    phone: '086-777-8899',
    faculty: 'วิทยาศาสตร์',
    department: 'วิทยาการคอมพิวเตอร์',
    program: 'วท.บ. วิทยาการคอมพิวเตอร์',
    generation: 'รุ่น 48',
    generationNumber: 48,
    admissionYear: 2565,
    status: 'studying',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
  },
  {
    studentId: '61010005',
    citizenIdLast4: '7890',
    prefixTh: 'นาย',
    firstNameTh: 'อนันต์',
    lastNameTh: 'รุ่งเรืองกิจ',
    fullNameTh: 'อนันต์ รุ่งเรืองกิจ',
    fullNameEn: 'Anan Rungruangkit',
    email: 'anan.r@mju.ac.th',
    phone: '082-333-4455',
    faculty: 'วิทยาศาสตร์',
    department: 'วิทยาการคอมพิวเตอร์',
    program: 'วท.บ. วิทยาการคอมพิวเตอร์',
    generation: 'รุ่น 44',
    generationNumber: 44,
    admissionYear: 2561,
    graduationYear: 2565,
    status: 'alumni',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
  },
  {
    studentId: '62010006',
    citizenIdLast4: '2345',
    prefixTh: 'นาย',
    firstNameTh: 'กิตติศักดิ์',
    lastNameTh: 'แซ่ลิ้ม',
    fullNameTh: 'กิตติศักดิ์ แซ่ลิ้ม',
    fullNameEn: 'Kittisak Saelim',
    email: 'kittisak.s@mju.ac.th',
    phone: '085-999-0011',
    faculty: 'วิทยาศาสตร์',
    department: 'วิทยาการคอมพิวเตอร์',
    program: 'วท.บ. วิทยาการคอมพิวเตอร์',
    generation: 'รุ่น 45',
    generationNumber: 45,
    admissionYear: 2562,
    graduationYear: 2566,
    status: 'alumni',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
  }
];

export class ApimjuClient {
  private baseUrl: string | null;
  private apiKey: string | null;

  constructor() {
    this.baseUrl = process.env.APIMJU_BASE_URL || null;
    this.apiKey = process.env.APIMJU_API_KEY || null;
  }

  /**
   * ดึงข้อมูลนักศึกษา/ศิษย์เก่ารายบุคคลตาม Student ID
   */
  async getStudentById(studentId: string): Promise<MjuStudent | null> {
    if (this.baseUrl) {
      try {
        const res = await fetch(`${this.baseUrl}/api/v1/students/${encodeURIComponent(studentId)}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey || ''}`,
            'Content-Type': 'application/json',
          },
          next: { revalidate: 3600 },
        });
        if (!res.ok) return null;
        return (await res.json()) as MjuStudent;
      } catch (err) {
        console.error('[apimju] Error calling getStudentById:', err);
      }
    }

    // Fallback Mock data
    const found = MOCK_MJU_STUDENTS.find(
      (s) => s.studentId === studentId || s.email === studentId
    );
    return found ? { ...found } : null;
  }

  /**
   * ค้นหาและฟิลเตอร์นักศึกษา/ศิษย์เก่า
   */
  async searchStudents(params: MjuSearchParams = {}): Promise<MjuStudent[]> {
    if (this.baseUrl) {
      try {
        const queryParams = new URLSearchParams();
        if (params.query) queryParams.set('q', params.query);
        if (params.generation) queryParams.set('generation', params.generation);
        if (params.status) queryParams.set('status', params.status);
        if (params.limit) queryParams.set('limit', String(params.limit));

        const res = await fetch(`${this.baseUrl}/api/v1/students?${queryParams.toString()}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey || ''}`,
            'Content-Type': 'application/json',
          },
          next: { revalidate: 300 },
        });
        if (res.ok) return (await res.json()) as MjuStudent[];
      } catch (err) {
        console.error('[apimju] Error calling searchStudents:', err);
      }
    }

    // Fallback Mock filter
    return MOCK_MJU_STUDENTS.filter((student) => {
      if (params.query) {
        const q = params.query.toLowerCase();
        const matchesName = student.fullNameTh.toLowerCase().includes(q) || (student.fullNameEn?.toLowerCase().includes(q) ?? false);
        const matchesId = student.studentId.includes(q);
        const matchesEmail = student.email.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesEmail) return false;
      }
      if (params.generation && !student.generation.includes(params.generation)) {
        return false;
      }
      if (params.status && student.status !== params.status) {
        return false;
      }
      return true;
    });
  }

  /**
   * ตรวจสอบความถูกต้องของรหัสนักศึกษาและข้อมูลยืนยันตัวตน
   */
  async verifyStudent(studentId: string, citizenIdLast4?: string): Promise<{ valid: boolean; student?: MjuStudent; message?: string }> {
    const student = await this.getStudentById(studentId);
    if (!student) {
      return { valid: false, message: 'ไม่พบข้อมูลรหัสนักศึกษานี้ในฐานข้อมูลของมหาวิทยาลัย' };
    }

    if (citizenIdLast4 && student.citizenIdLast4 && student.citizenIdLast4 !== citizenIdLast4) {
      return { valid: false, message: 'เลขท้ายบัตรประชาชน 4 หลักไม่ตรงกับข้อมูลในระบบมหาวิทยาลัย' };
    }

    return { valid: true, student };
  }
}

export const apimju = new ApimjuClient();
