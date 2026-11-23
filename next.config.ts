import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "bcryptjs"],
  // จำเป็นสำหรับ Docker build แบบ standalone (ดู Dockerfile / deploy-to-server.sh)
  output: "standalone",
  // Security headers พื้นฐาน: กันหน้าเว็บถูกฝังใน iframe ของเว็บอื่น (clickjacking ปุ่มแอดมิน),
  // กัน browser เดา content-type เอง (MIME sniffing) และไม่ส่ง URL เต็มไปยังเว็บภายนอก
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
