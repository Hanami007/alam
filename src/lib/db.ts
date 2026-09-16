import { Pool } from 'pg';

// ต้องติดตั้งก่อนใช้งาน: npm install pg && npm install -D @types/pg
// แล้วตั้งค่า DATABASE_URL ใน .env.local ให้ตรงกับ docker-compose.yml (ดู .env.example)
//
// ฟังก์ชัน query ของแต่ละโดเมนถูกย้ายไปอยู่ใน service ของแต่ละ module แล้ว
// (เช่น src/modules/feed/services/feed.service.ts, src/modules/gallery/services/gallery.service.ts ฯลฯ)
// ไฟล์นี้เหลือหน้าที่เดียวคือ export `pool` ให้ service/route ต่างๆ ใช้ร่วมกัน

declare global {
  // กัน Next.js dev-mode สร้าง pool ใหม่ทุกครั้งที่ hot-reload
  // eslint-disable-next-line no-var
  var _alumniPool: Pool | undefined;
}

export const pool =
  global._alumniPool ??
  new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://alumni:alumni_dev_password@localhost:5435/alumni_db',
  });

if (process.env.NODE_ENV !== 'production') {
  global._alumniPool = pool;
}
