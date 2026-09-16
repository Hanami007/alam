#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# รัน "บนเซิร์ฟเวอร์" (ผ่าน KiTTY) ครั้งเดียวเพื่อตั้ง Nginx reverse proxy
# ให้ https://alumni.csmju.com (ผ่าน Cloudflare) วิ่งเข้า container ที่พอร์ต 4007
#
# ก่อนรัน: ต้อง deploy แอปให้ container 'alam-app' รันอยู่ที่พอร์ต 4007 แล้ว
# (ดู redeploy.sh)
#
# ใช้งาน:
#   chmod +x setup-reverse-proxy.sh
#   sudo ./setup-reverse-proxy.sh
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

DOMAIN="${DOMAIN:-alumni.csmju.com}"
APP_PORT="${APP_PORT:-4007}"

if [[ $EUID -ne 0 ]]; then
  echo "✗ ต้องรันด้วย sudo: sudo ./setup-reverse-proxy.sh" >&2
  exit 1
fi

if ! command -v nginx >/dev/null 2>&1; then
  echo "▶ ไม่พบ nginx — ติดตั้งให้..."
  if command -v apt >/dev/null 2>&1; then
    apt update && apt install -y nginx
  elif command -v dnf >/dev/null 2>&1; then
    dnf install -y nginx
  else
    echo "✗ หา package manager ไม่เจอ (ไม่ใช่ apt/dnf) — ติดตั้ง nginx เองก่อนแล้วรันสคริปต์นี้ใหม่" >&2
    exit 1
  fi
fi

echo "▶ เขียน nginx config สำหรับ $DOMAIN -> 127.0.0.1:$APP_PORT ..."
CONF_PATH="/etc/nginx/sites-available/${DOMAIN}"
cat > "$CONF_PATH" <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

mkdir -p /etc/nginx/sites-enabled
ln -sf "$CONF_PATH" "/etc/nginx/sites-enabled/${DOMAIN}"

echo "▶ ตรวจสอบ config และ reload nginx ..."
nginx -t
systemctl reload nginx || systemctl restart nginx
systemctl enable nginx >/dev/null 2>&1 || true

echo "✓ เสร็จแล้ว — nginx กำลัง proxy $DOMAIN -> 127.0.0.1:$APP_PORT"
echo "  ⚠ ไปที่ Cloudflare Dashboard -> SSL/TLS -> ตั้งเป็น 'Flexible'"
echo "    (เพราะเซิร์ฟเวอร์นี้ยังไม่มี TLS cert ของตัวเอง) แล้วเปิด https://${DOMAIN}"
