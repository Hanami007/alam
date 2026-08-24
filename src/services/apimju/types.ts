/**
 * TypeScript definitions for apimju (MJU Student & Alumni API Service)
 * Represents student registry, academic status, enrollment, and faculty data.
 */

export type MjuEnrollmentStatus = 'studying' | 'graduated' | 'alumni' | 'resigned' | 'retired';

export interface MjuStudent {
  studentId: string;           // เช่น "60010001"
  citizenIdLast4?: string;     // 4 ตัวท้ายบัตรประชาชน (สำหรับ verify)
  prefixTh?: string;           // นาย / นางสาว
  firstNameTh: string;         // สมชาย
  lastNameTh: string;          // ใจดี
  fullNameTh: string;          // สมชาย ใจดี
  fullNameEn?: string;         // Somchai Jaidee
  email: string;               // somchai.j@mju.ac.th
  phone?: string;              // 081-234-5678
  faculty: string;             // วิทยาศาสตร์
  department: string;          // วิทยาการคอมพิวเตอร์
  program: string;             // วท.บ. วิทยาการคอมพิวเตอร์
  generation: string;          // รุ่น 43
  generationNumber: number;    // 43
  admissionYear: number;       // 2560 (2017)
  graduationYear?: number;     // 2564 (2021)
  status: MjuEnrollmentStatus; // studying | alumni | graduated
  avatarUrl?: string;
}

export interface MjuSearchParams {
  query?: string;
  generation?: string;
  generationNumber?: number;
  status?: MjuEnrollmentStatus;
  department?: string;
  limit?: number;
  offset?: number;
}
