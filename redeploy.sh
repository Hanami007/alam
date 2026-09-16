#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# สคริปต์นี้รัน "บนเซิร์ฟเวอร์" เอง (ไม่ใช่เครื่อง dev) — ออกแบบไว้ให้ใช้ผ่าน
# terminal ของ KiTTY/PuTTY: SSH เข้าเซิร์ฟเวอร์แล้วรันไฟล์นี้ทุกครั้งที่อัปเดตโค้ด
#
# ใช้งานครั้งแรก (บนเซิร์ฟเวอร์):
#   git clone https://github.com/Hanami007/alam.git ~/apps/alam
#   cd ~/apps/alam
#   nano .env.production        # กรอก DATABASE_URL ฯลฯ (ดู deploy.env.example)
#   chmod +x redeploy.sh
#   ./redeploy.sh
#
# ครั้งต่อไป แค่ SSH เข้ามาแล้วรัน:
#   cd ~/apps/alam && ./redeploy.sh
# ─────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

APP_PORT="${APP_PORT:-4007}"
CONTAINER_NAME="${CONTAINER_NAME:-alam-app}"
IMAGE_NAME="${IMAGE_NAME:-alam-app}"

if [[ ! -f .env.production ]]; then
  echo "✗ ไม่พบ .env.production ในโฟลเดอร์นี้ — สร้างก่อน (ดู deploy.env.example เป็นตัวอย่าง)" >&2
  exit 1
fi

echo "▶ ดึงโค้ดล่าสุด ..."
git pull

echo "▶ build image ..."
docker build -t "$IMAGE_NAME" .

echo "▶ รัน container ใหม่ (พอร์ต $APP_PORT) ..."
docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
docker rm "$CONTAINER_NAME" >/dev/null 2>&1 || true
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p "${APP_PORT}:3000" \
  --env-file .env.production \
  "$IMAGE_NAME"

echo "✓ เสร็จแล้ว — ตรวจสอบด้วย: docker logs -f $CONTAINER_NAME"
