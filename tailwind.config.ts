// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  // สำคัญมาก: ตรงนี้บอกให้ Tailwind ไปดูไฟล์ .tsx ของเรา
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}", // เช็ค path นี้ให้ถูกตามโฟลเดอร์จริงของคุณ
  ],
  theme: {
    extend: {
      // ตรงนี้คือที่ประกาศสีและแสงเงาที่เราใช้ในโค้ด AppShell ครับ
      colors: {
        background: "#020617", // น้ำเงินเข้ม
        card: "rgba(2, 6, 23, 0.6)", // พื้นหลังใส
        border: "rgba(255, 255, 255, 0.1)", // เส้นขอบบางๆ
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, #22d3ee, #2563eb, #9333ea)', // สีรุ้ง ฟ้า-ม่วง
      },
      boxShadow: {
        'cyan-glow': '0 0 15px rgba(34, 211, 238, 0.3)', // แสงเรืองแสงสีฟ้า
        'purple-glow': '0 0 15px rgba(168, 85, 247, 0.2)', // แสงเรืองแสงสีม่วง
      }
    },
  },
  plugins: [],
};
export default config;