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
  facebook_url?: string | null;
  line_id?: string | null;
}

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
          prov.extra->>'city' as city,
          CASE WHEN u.show_contact_on_map THEN u.facebook_url END as facebook_url,
          CASE WHEN u.show_contact_on_map THEN u.line_id END as line_id
        FROM users u
        JOIN lookup_options prov ON prov.id = COALESCE(u.hometown_province_id, u.province_option_id)
        LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
        LEFT JOIN lookup_options ct ON ct.id = u.career_option_id
        WHERE u.show_hometown_on_map = true AND u.status = 'approved'
        ORDER BY u.id ASC
      `);
      return rows;
    } catch (err) {
      console.error('[MapDbService] getHometownDistribution error:', err);
      return [];
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
          prov.extra->>'city' as city,
          CASE WHEN u.show_contact_on_map THEN u.facebook_url END as facebook_url,
          CASE WHEN u.show_contact_on_map THEN u.line_id END as line_id
        FROM users u
        JOIN lookup_options prov ON prov.id = COALESCE(u.work_province_id, u.province_option_id)
        LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
        LEFT JOIN lookup_options ct ON ct.id = u.career_option_id
        WHERE u.show_workplace_on_map = true AND u.status = 'approved'
        ORDER BY u.id ASC
      `);
      return rows;
    } catch (err) {
      console.error('[MapDbService] getWorkplaceDistribution error:', err);
      return [];
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

