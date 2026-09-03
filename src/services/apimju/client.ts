import { MjuStudent, MjuSearchParams } from './types';

/**
 * Mock university student & alumni dataset for development & testing.
 * When APIMJU_BASE_URL is defined, the client will call the real MJU API.
 */
const MOCK_MJU_STUDENTS: MjuStudent[] = [];

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
