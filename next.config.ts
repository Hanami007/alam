import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "bcryptjs"],
  // จำเป็นสำหรับ Docker build แบบ standalone (ดู Dockerfile / deploy-to-server.sh)
  output: "standalone",
};

export default nextConfig;
