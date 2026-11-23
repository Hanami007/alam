/**
 * กติการหัสนักศึกษา CS แม่โจ้ — ใช้ร่วมกันทั้งหน้าสมัคร (client) และ API (server)
 *
 * รับได้ 2 รูปแบบ:
 *   - 10 หลัก (ระบบปัจจุบัน): รุ่น = 2 หลักแรก − 37   เช่น 66xxxxxxxx → รุ่น 29
 *   - 8 หลัก  (ระบบเดิม):     รุ่น = 2 หลักแรก − 17   เช่น 18xxxxxx   → รุ่น 1, 47xxxxxx → รุ่น 30
 *
 * ปีที่เข้าศึกษาคำนวณจากเลขรุ่น (รุ่น 1 เข้าปี 2538) แทนการเอา 2500 + 2 หลักแรก
 * เพราะสูตรนั้นใช้ได้เฉพาะรหัส 10 หลัก รหัส 8 หลักจะได้ปีผิดไป 20 ปี
 */

export const STUDENT_ID_LENGTHS = [8, 10] as const;
export type StudentIdLength = (typeof STUDENT_ID_LENGTHS)[number];

/** ค่าที่ลบออกจาก 2 หลักแรกเพื่อได้เลขรุ่น แยกตามความยาวรหัส */
export const GENERATION_OFFSET: Record<StudentIdLength, number> = {
  10: 37,
  8: 17,
};

/** ปี พ.ศ. ที่รุ่น 1 เข้าศึกษา */
export const FIRST_GENERATION_ENTRY_YEAR_BE = 2538;

export const STUDY_DURATION_YEARS = 4;

export interface ParsedStudentId {
  studentId: string;
  length: StudentIdLength;
  prefix: string;
  generationNumber: number;
  entryYearBE: number;
  expectedGraduationYearBE: number;
}

export function isValidStudentIdFormat(raw: string): boolean {
  return /^(\d{8}|\d{10})$/.test(raw.trim());
}

/** แยกรหัสนักศึกษา คืน null ถ้ารูปแบบผิดหรือคำนวณได้รุ่นน้อยกว่า 1 */
export function parseStudentId(raw: string, expectedLength?: StudentIdLength): ParsedStudentId | null {
  const studentId = raw.trim();
  if (!isValidStudentIdFormat(studentId)) return null;
  // หน้าสมัครให้ผู้ใช้เลือกรูปแบบก่อน — กันไม่ให้รหัส 10 หลักที่พิมพ์ได้ 8 หลักถูกตีความเป็นรหัสระบบเดิม
  if (expectedLength && studentId.length !== expectedLength) return null;

  const length = studentId.length as StudentIdLength;
  const prefix = studentId.slice(0, 2);
  const generationNumber = parseInt(prefix, 10) - GENERATION_OFFSET[length];
  if (generationNumber < 1) return null;

  const entryYearBE = FIRST_GENERATION_ENTRY_YEAR_BE + generationNumber - 1;
  return {
    studentId,
    length,
    prefix,
    generationNumber,
    entryYearBE,
    expectedGraduationYearBE: entryYearBE + STUDY_DURATION_YEARS,
  };
}

/** เรียนครบ 4 ปีแล้วหรือยัง (นับจากปี พ.ศ. ปัจจุบัน) */
export function isAlumniByEntryYear(entryYearBE: number, now = new Date()): boolean {
  const currentYearBE = now.getFullYear() + 543;
  return entryYearBE + STUDY_DURATION_YEARS <= currentYearBE;
}
