import { pool } from '@/lib/db';

/**
 * ข้อมูลอ้างอิงที่ใช้ร่วมกันหลายโมดูล (generation / province / career type)
 * คงไว้เป็น shared service ใน src/services/db แทนที่จะผูกกับโมดูลใดโมดูลหนึ่ง
 * เพราะถูกใช้ข้าม feature หลายจุด (register, search, map, feed ฯลฯ)
 */
export class LookupDbService {
  /** ดึง generations ทั้งหมดสำหรับ dropdown filter */
  async getGenerations() {
    const { rows } = await pool.query(
      `SELECT id, code, label, extra FROM lookup_options
       WHERE category = 'generation'
       ORDER BY COALESCE((extra->>'gen_number')::int, id) DESC`
    );
    return rows;
  }

  /** ดึงจังหวัดและประเทศทั้งหมด พร้อม region, metro flag และข้อมูลต่างประเทศ */
  async getAllProvinces() {
    const { rows } = await pool.query(
      `SELECT id, code, label,
              COALESCE(extra->>'region', 'อื่นๆ') AS region,
              COALESCE((extra->>'metro')::boolean, false) AS metro,
              COALESCE((extra->>'is_international')::boolean, false) AS is_international,
              extra->>'country_code' AS country_code,
              extra->>'flag' AS flag,
              (extra->>'lat')::float AS lat,
              (extra->>'lng')::float AS lng,
              extra->>'city' AS city
       FROM lookup_options
       WHERE category = 'province'
       ORDER BY CASE WHEN extra->>'region' = 'ต่างประเทศ' THEN 1 ELSE 0 END, label`
    );
    return rows;
  }

  /** ดึง career types สำหรับ dropdown */
  async getCareerTypes() {
    const { rows } = await pool.query(
      `SELECT id, code, label FROM lookup_options WHERE category = 'career_type' ORDER BY label`
    );
    return rows;
  }
}

export const lookupDbService = new LookupDbService();
