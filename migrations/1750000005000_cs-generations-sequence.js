/* eslint-disable camelcase */

/**
 * Migration 005 — CS MJU Generations Sequence
 * 
 * กำหนดรุ่นวิทยาการคอมพิวเตอร์ แม่โจ้:
 * รหัส 2 ตัวแรก - 37 = รุ่น
 * ตัวอย่าง: รหัสขึ้นต้นด้วย 66 คือ รุ่น 29 (เข้าศึกษาปี 2566)
 * รหัสขึ้นต้นด้วย 67 คือ รุ่น 30 (เข้าศึกษาปี 2567)
 * รหัสขึ้นต้นด้วย 65 คือ รุ่น 28 (เข้าศึกษาปี 2565)
 * รหัสขึ้นต้นด้วย 38 คือ รุ่น 1 (เข้าศึกษาปี 2538)
 */

exports.up = (pgm) => {
  for (let gen = 1; gen <= 35; gen++) {
    const prefix = gen + 37;
    const entryYearBE = 2500 + prefix;
    const entryYearCE = entryYearBE - 543;
    const code = `gen-${gen}`;
    const label = `รุ่น ${gen}`;
    const extra = JSON.stringify({
      gen_number: gen,
      prefix: String(prefix),
      entry_year_be: entryYearBE,
      year_start: entryYearCE,
      year_end: entryYearCE + 4,
    });

    pgm.sql(`
      INSERT INTO lookup_options (category, code, label, extra)
      VALUES ('generation', '${code}', '${label}', '${extra}'::jsonb)
      ON CONFLICT (category, code) DO UPDATE
      SET label = EXCLUDED.label, extra = EXCLUDED.extra;
    `);
  }

  // เชื่อมโยง users ที่มีอยู่เดิมให้ตรงกับรุ่นตามรหัสนักศึกษา 2 หลักแรก
  pgm.sql(`
    UPDATE users u
    SET generation_option_id = lo.id
    FROM lookup_options lo
    WHERE u.student_id ~ '^[0-9]{2}'
      AND (substring(u.student_id from 1 for 2)::int - 37) >= 1
      AND lo.category = 'generation'
      AND lo.code = 'gen-' || (substring(u.student_id from 1 for 2)::int - 37);
  `);
};

exports.down = () => {
  // no-op
};
