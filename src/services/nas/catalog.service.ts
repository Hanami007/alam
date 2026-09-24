import { pool } from '@/lib/db';
import { synologyApi } from './synology-api.service';

export interface ParsedNasPhoto {
  id: string;
  filename: string;          // e.g. "6504101302.JPG"
  rawPath: string;           // e.g. "รุ่น 28/ธรรมเนียบ/6504101302.JPG"
  studentId: string;         // e.g. "6504101302"
  year: number;              // 65
  yearLabel: string;         // "ปี 2565"
  generationNumber: number;  // 28
  generationLabel: string;   // "รุ่น 28"
  personCode: string;        // "302"
  subfolder: string;         // "ธรรมเนียบ"
  photoUrl: string;          // "/api/nas/image/..."
  studentName: string;
  degree?: string;
  company?: string;
}

export interface GenerationSummary {
  generationNumber: number;
  generationLabel: string;
  year: number;
  yearLabel: string;
  totalPhotos: number;
  subfolders: string[];
  quiz: string;
}

const DEFAULT_NAMES = [
  'กานดา วัฒนวิทย์', 'นพวรรณ รัตนไพศาล', 'พงษ์ศกร สุขเกษม',
  'ธีรภัทร ชาญวิทย์', 'อภิสิทธิ์ ศรีสวัสดิ์', 'วรรณภา มณีโชติ',
  'กิตติศักดิ์ พรหมมินทร์', 'ศิริพร วงศ์สว่าง', 'ณัฐพล ไชยวงค์',
  'ชุติมา ประเสริฐ', 'วรวุฒิ สิทธิชัย', 'ปิยะมาศ จันทร์เรือง',
  'ธนากร บัวแก้ว', 'สุรีย์พร แก้วมณี', 'อนุชา ทองหล่อ',
  'พิชญาภา อินทวงศ์', 'ชนาธิป ธรรมรัตน์', 'สุดารัตน์ พุ่มไม้',
  'ศุภกร เจริญสุข', 'รพีภัทร ศรีคำ', 'เบญจวรรณ พัฒนกิจ',
  'กิตติพงษ์ ยิ้มแย้ม', 'ปัทมา สดใส', 'ธนาคาร วัฒนสุข',
];

export class NasCatalogService {
  /**
   * ดึงรายการรูปภาพจริงทั้งหมดจาก Synology NAS สำหรับรุ่นที่เลือก
   * รองรับทุกโฟลเดอร์ย่อย และทุกรูปแบบชื่อไฟล์ (6504101302.JPG, 6704101301 (1).JPG, 301 (1).JPG, IMG_...)
   */
  async getPhotosForGeneration(genNumber: number, selectedSubfolder: string = ''): Promise<ParsedNasPhoto[]> {
    const genFolder = genNumber === 32 ? 'รุ่น32' : `รุ่น ${genNumber}`;
    const year = genNumber + 37;

    // 1. ดึงโครงสร้างโฟลเดอร์และไฟล์จาก NAS
    const directItems = await synologyApi.listFiles(genFolder);
    const subfolders = directItems.filter((i) => i.isdir).map((i) => i.name);

    let targetFiles: { name: string; subfolder: string; rawRelPath: string }[] = [];

    // ถ้าผู้ใช้เลือกโฟลเดอร์ย่อยเฉพาะ
    if (selectedSubfolder) {
      const subItems = await synologyApi.listFiles(`${genFolder}/${selectedSubfolder}`);
      const imageFiles = subItems.filter((f) => !f.isdir && /\.(jpg|jpeg|png|webp)$/i.test(f.name));
      targetFiles = imageFiles.map((f) => ({
        name: f.name,
        subfolder: selectedSubfolder,
        rawRelPath: `${genFolder}/${selectedSubfolder}/${f.name}`,
      }));
    } else {
      // ดึงไฟล์ในโฟลเดอร์รากของรุ่นนั้นก่อน
      const directImages = directItems.filter((f) => !f.isdir && /\.(jpg|jpeg|png|webp)$/i.test(f.name));
      
      // ถ้ามีไฟล์ที่ตั้งชื่อด้วยรหัสนักศึกษาโดยตรง (เช่น รุ่น 20, รุ่น 30, รุ่น 31)
      const studentDirectImages = directImages.filter((f) => /\d{3}/.test(f.name));
      if (studentDirectImages.length > 0) {
        targetFiles = studentDirectImages.map((f) => ({
          name: f.name,
          subfolder: '',
          rawRelPath: `${genFolder}/${f.name}`,
        }));
      } else {
        // ค้นหาในโฟลเดอร์ย่อยที่สำคัญตามลำดับความสำคัญ
        const prioritySubfolders = [
          `${genNumber}_ชุดครุย`,
          'ชุดครุย',
          'รูปหน้าตรง',
          'รูปนศ',
          'ธรรมเนียบ',
          'รูปบัตร นศ. ' + genNumber,
          'ทางการ',
          'Free',
          'ถ่ายรูปหมู่',
        ];

        let foundSubfolder = '';
        for (const pref of prioritySubfolders) {
          const matchedSub = subfolders.find((s) => s.toLowerCase() === pref.toLowerCase() || s.includes(pref));
          if (matchedSub) {
            const subItems = await synologyApi.listFiles(`${genFolder}/${matchedSub}`);
            const images = subItems.filter((f) => !f.isdir && /\.(jpg|jpeg|png|webp)$/i.test(f.name));
            if (images.length > 0) {
              foundSubfolder = matchedSub;
              targetFiles = images.map((f) => ({
                name: f.name,
                subfolder: matchedSub,
                rawRelPath: `${genFolder}/${matchedSub}/${f.name}`,
              }));
              break;
            }
          }
        }

        // ถ้ายังไม่เจอ ให้ดึงไฟล์จากโฟลเดอร์ย่อยแรกที่มีรูป
        if (targetFiles.length === 0) {
          for (const sub of subfolders) {
            const subItems = await synologyApi.listFiles(`${genFolder}/${sub}`);
            const images = subItems.filter((f) => !f.isdir && /\.(jpg|jpeg|png|webp)$/i.test(f.name));
            if (images.length > 0) {
              targetFiles = images.map((f) => ({
                name: f.name,
                subfolder: sub,
                rawRelPath: `${genFolder}/${sub}/${f.name}`,
              }));
              break;
            }
          }
        }
      }
    }

    // 2. แปลงรายการไฟล์จริงเป็น ParsedNasPhoto
    if (targetFiles.length > 0) {
      const seenCodes = new Set<string>();
      const parsedList: ParsedNasPhoto[] = [];

      for (const item of targetFiles) {
        // สกัดตัวเลขรหัสจากชื่อไฟล์ เช่น "6504101302.JPG", "6704101301 (1).JPG", "301 (1).JPG"
        const digitsMatch = item.name.match(/(\d{10})/); // รหัส 10 หลัก
        const shortMatch = item.name.match(/(\d{3})/);    // รหัส 3 ตัวท้าย

        let studentId = '';
        let personCode = '';

        if (digitsMatch) {
          studentId = digitsMatch[1];
          personCode = studentId.slice(-3);
        } else if (shortMatch) {
          personCode = shortMatch[1];
          studentId = `${year}04101${personCode}`;
        } else {
          studentId = item.name.replace(/\.[^/.]+$/, '');
          personCode = '000';
        }

        // ข้ามไฟล์ซ้ำที่เป็นมุมกล้องอื่น (1), (2), (3) ในการ์ดหลัก
        const dedupeKey = `${personCode}-${item.name.replace(/\s*\(\d+\)/, '')}`;
        if (personCode !== '000' && seenCodes.has(dedupeKey)) {
          continue;
        }
        if (personCode !== '000') {
          seenCodes.add(dedupeKey);
        }

        const photoUrl = `/api/nas/image?path=${encodeURIComponent(item.rawRelPath)}&v=syno`;

        parsedList.push({
          id: `nas-${genNumber}-${item.rawRelPath}`,
          filename: item.name,
          rawPath: item.rawRelPath,
          studentId,
          year,
          yearLabel: `ปี 25${year}`,
          generationNumber: genNumber,
          generationLabel: `รุ่น ${genNumber}`,
          personCode,
          subfolder: item.subfolder,
          photoUrl,
          studentName: DEFAULT_NAMES[parseInt(personCode || '301', 10) % DEFAULT_NAMES.length],
          degree: 'วท.บ. วิทยาการคอมพิวเตอร์ แม่โจ้',
          company: 'วิทยาการคอมพิวเตอร์ มหาวิทยาลัยแม่โจ้',
        });
      }

      // เรียงลำดับตามรหัสนักศึกษา
      parsedList.sort((a, b) => a.studentId.localeCompare(b.studentId));
      return parsedList;
    }

    // Fallback: หากรุ่นนั้นยังไม่มีไฟล์ภาพบน NAS เลย
    const fallbackList: ParsedNasPhoto[] = [];
    for (let i = 0; i < 24; i++) {
      const pCode = String(301 + i);
      const sId = `${year}04101${pCode}`;
      fallbackList.push({
        id: `nas-${genNumber}-${sId}`,
        filename: `${sId}.jpg`,
        rawPath: `${genFolder}/${sId}.jpg`,
        studentId: sId,
        year,
        yearLabel: `ปี 25${year}`,
        generationNumber: genNumber,
        generationLabel: `รุ่น ${genNumber}`,
        personCode: pCode,
        subfolder: selectedSubfolder,
        photoUrl: `/api/nas/image/${encodeURIComponent(`รุ่น ${genNumber}`)}/${sId}?v=syno`,
        studentName: DEFAULT_NAMES[i % DEFAULT_NAMES.length],
        degree: 'วท.บ. วิทยาการคอมพิวเตอร์ แม่โจ้',
        company: 'วิทยาการคอมพิวเตอร์ มหาวิทยาลัยแม่โจ้',
      });
    }

    return fallbackList;
  }

  /**
   * ดึงเฉพาะเลขรุ่นที่มีโฟลเดอร์จริงอยู่บน NAS (ไม่ดึงโฟลเดอร์ย่อย/รูปภาพ) สำหรับใช้เป็น
   * ตัวเลือกในดรอปดาวน์ต่างๆ โดยไม่ต้องยิง listFiles ซ้ำต่อรุ่นแบบ getGenerationsSummary
   */
  async getGenerationNumbers(): Promise<number[]> {
    const rootItems = await synologyApi.listFiles('');
    const genNumbers = rootItems
      .filter((i) => i.isdir)
      .map((i) => {
        const match = i.name.match(/^รุ่น\s*(\d+)$/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((n): n is number => n !== null)
      .sort((a, b) => a - b);

    await this.syncGenerationsToDatabase(genNumbers);
    return genNumbers;
  }

  /**
   * ดึงโครงสร้างโฟลเดอร์รุ่นและโฟลเดอร์ย่อยทั้งหมดแบบ Real-time จาก Synology NAS
   * ค้นหาโฟลเดอร์รุ่นจริงที่มีอยู่บน NAS เอง (ไม่ hardcode ช่วงรุ่นตายตัวแล้ว) — ถ้า NAS
   * มีการสร้างโฟลเดอร์รุ่นใหม่เพิ่มเข้ามา ระบบจะเจอและซิงค์เข้า lookup_options ให้อัตโนมัติ
   */
  async getGenerationsSummary(): Promise<GenerationSummary[]> {
    const summaries: GenerationSummary[] = [];

    const quizzes: Record<number, string> = {
      20: 'อาจารย์ประจำสาขาของรุ่น 20 คือใคร?',
      21: 'สถานที่จัดค่ายรับน้องของรุ่น 21 คือที่ไหน?',
      22: 'ชื่อประธานรุ่นหรืออาจารย์ที่ปรึกษารุ่น 22 คือใคร?',
      23: 'อาจารย์ที่ปรึกษาของรุ่น 23 ชื่ออะไร?',
      24: 'อาจารย์ที่ปรึกษาหรือสโลแกนรุ่น 24 คืออะไร?',
      25: 'อาจารย์ที่ปรึกษาของรุ่น 25 ชื่ออะไร?',
      26: 'สถานที่จัดสัมมนารุ่น 26 คือที่ใด?',
      27: 'อาจารย์ที่ปรึกษาของรุ่น 27 ชื่ออะไร?',
      28: 'อาจารย์ที่ปรึกษาของรุ่น 28 ชื่ออะไร?',
      29: 'อาจารย์ที่ปรึกษาของรุ่น 29 ชื่ออะไร?',
      30: 'อาจารย์ที่ปรึกษาของรุ่น 30 ชื่ออะไร?',
      31: 'อาจารย์ที่ปรึกษาของรุ่น 31 ชื่ออะไร?',
      32: 'อาจารย์ที่ปรึกษาของรุ่น 32 คือใคร?',
    };

    // ค้นหาโฟลเดอร์รุ่นจริงทั้งหมดที่มีอยู่บนรากของ NAS (เช่น "รุ่น 20", "รุ่น32")
    const rootItems = await synologyApi.listFiles('');
    const genNumbers = rootItems
      .filter((i) => i.isdir)
      .map((i) => {
        const match = i.name.match(/^รุ่น\s*(\d+)$/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((n): n is number => n !== null)
      .sort((a, b) => a - b);

    // ซิงค์รุ่นที่เจอจริงเข้า lookup_options ให้ครบ (สร้างเฉพาะรุ่นที่ยังไม่มี ไม่แตะรุ่นเดิม)
    await this.syncGenerationsToDatabase(genNumbers);

    for (const gen of genNumbers) {
      const genName = gen === 32 ? 'รุ่น32' : `รุ่น ${gen}`;
      const year = gen + 37;

      // ดึงโฟลเดอร์ย่อยจริง
      const subItems = await synologyApi.listFiles(genName);
      const subfolderNames = subItems.filter((i) => i.isdir).map((i) => i.name);

      summaries.push({
        generationNumber: gen,
        generationLabel: `รุ่น ${gen}`,
        year,
        yearLabel: `ปี 25${year}`,
        totalPhotos: 24,
        subfolders: subfolderNames,
        quiz: quizzes[gen] || `อาจารย์ที่ปรึกษาของรุ่น ${gen} ชื่ออะไร?`,
      });
    }

    return summaries;
  }

  /**
   * สร้างรายการรุ่นใน lookup_options ให้ครบตามโฟลเดอร์จริงบน NAS
   * (ใช้ WHERE NOT EXISTS แทน ON CONFLICT เพราะตาราง lookup_options ไม่มี unique
   * constraint บน (category, code) ในบาง environment)
   */
  private async syncGenerationsToDatabase(genNumbers: number[]): Promise<void> {
    if (genNumbers.length === 0) return;
    for (const gen of genNumbers) {
      try {
        await pool.query(
          `INSERT INTO lookup_options (category, code, label)
           SELECT 'generation', $1, $2
           WHERE NOT EXISTS (
             SELECT 1 FROM lookup_options WHERE category = 'generation' AND label = $2
           )`,
          [`gen-${gen}`, `รุ่น ${gen}`]
        );
      } catch (err) {
        console.error(`[NasCatalogService] syncGenerationsToDatabase error for gen ${gen}:`, err);
      }
    }
  }
}

export const nasCatalogService = new NasCatalogService();
