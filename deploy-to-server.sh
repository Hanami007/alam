#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# Deploy โปรเจกต์ alam ขึ้นเซิร์ฟเวอร์รีโมท (Docker เท่านั้น) ผ่าน SSH
# แพ็คโค้ด -> โอนขึ้นเซิร์ฟเวอร์ -> docker build -> docker run เปิดที่พอร์ตที่กำหนด (ค่าเริ่มต้น 4007)
#
# ใช้งาน:
#   cp deploy.env.example deploy.env   # กรอกค่าจริงก่อนรันครั้งแรก
#   ./deploy-to-server.sh
#
# ไม่ต้องมี rsync/docker บนเครื่องนี้ — ใช้แค่ tar + ssh + scp (มีอยู่แล้ว)
# เซิร์ฟเวอร์ปลายทางต้องมี Docker ติดตั้งไว้แล้วเท่านั้น
# ─────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

ENV_FILE="deploy.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "✗ ไม่พบไฟล์ $ENV_FILE — สร้างจากตัวอย่างก่อน:" >&2
  echo "    cp deploy.env.example deploy.env" >&2
  echo "  แล้วกรอกค่า SSH/DATABASE_URL ให้ตรงกับเซิร์ฟเวอร์จริงของคุณ" >&2
  exit 1
fi

# โหลดค่าจากไฟล์ .env แบบ KEY=VALUE (ข้ามบรรทัดว่าง/คอมเมนต์)
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${DEPLOY_SSH_USER:?ต้องตั้งค่า DEPLOY_SSH_USER ใน $ENV_FILE}"
: "${DEPLOY_SSH_HOST:?ต้องตั้งค่า DEPLOY_SSH_HOST ใน $ENV_FILE}"
DEPLOY_SSH_PORT="${DEPLOY_SSH_PORT:-22}"
DEPLOY_REMOTE_DIR="${DEPLOY_REMOTE_DIR:-~/apps/alam}"
DEPLOY_APP_PORT="${DEPLOY_APP_PORT:-4007}"
DEPLOY_CONTAINER_NAME="${DEPLOY_CONTAINER_NAME:-alam-app}"
DEPLOY_IMAGE_NAME="${DEPLOY_IMAGE_NAME:-alam-app}"

if [[ "$DEPLOY_SSH_HOST" == "your.server.ip.or.hostname" ]]; then
  echo "✗ ยังไม่ได้แก้ DEPLOY_SSH_HOST ใน $ENV_FILE ให้เป็นเซิร์ฟเวอร์จริง" >&2
  exit 1
fi

SSH_TARGET="${DEPLOY_SSH_USER}@${DEPLOY_SSH_HOST}"
SSH_OPTS=(-p "$DEPLOY_SSH_PORT")

echo "▶ เชื่อมต่อ ${SSH_TARGET}:${DEPLOY_SSH_PORT} ..."
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "command -v docker >/dev/null || { echo '✗ ไม่พบ docker บนเซิร์ฟเวอร์ปลายทาง'; exit 1; }; mkdir -p '$DEPLOY_REMOTE_DIR'"

echo "▶ แพ็คซอร์สโค้ดและโอนขึ้นเซิร์ฟเวอร์ ($DEPLOY_REMOTE_DIR) ..."
tar czf - \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='deploy.env' \
  --exclude='scratch' \
  --exclude='*.tsbuildinfo' \
  . \
| ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "tar xzf - -C '$DEPLOY_REMOTE_DIR'"

echo "▶ ส่งค่า environment สำหรับรันจริงขึ้นเซิร์ฟเวอร์ ..."
# บรรทัดใดไม่ได้ขึ้นต้นด้วย DEPLOY_ (และไม่ใช่คอมเมนต์/บรรทัดว่าง) ถือเป็น env ของแอปจริง
TMP_APP_ENV="$(mktemp)"
trap 'rm -f "$TMP_APP_ENV"' EXIT
grep -Ev '^\s*(#|DEPLOY_|\s*$)' "$ENV_FILE" > "$TMP_APP_ENV"
scp -P "$DEPLOY_SSH_PORT" "$TMP_APP_ENV" "$SSH_TARGET:$DEPLOY_REMOTE_DIR/.env.production" >/dev/null

echo "▶ build + รัน container บนเซิร์ฟเวอร์ (พอร์ต $DEPLOY_APP_PORT) ..."
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" bash -s <<REMOTE
set -euo pipefail
cd '$DEPLOY_REMOTE_DIR'
docker build -t '$DEPLOY_IMAGE_NAME' .
docker stop '$DEPLOY_CONTAINER_NAME' >/dev/null 2>&1 || true
docker rm '$DEPLOY_CONTAINER_NAME' >/dev/null 2>&1 || true
docker run -d \
  --name '$DEPLOY_CONTAINER_NAME' \
  --restart unless-stopped \
  -p '$DEPLOY_APP_PORT:3000' \
  --env-file '$DEPLOY_REMOTE_DIR/.env.production' \
  '$DEPLOY_IMAGE_NAME'
REMOTE

echo "✓ Deploy สำเร็จ — เข้าใช้งานได้ที่ http://${DEPLOY_SSH_HOST}:${DEPLOY_APP_PORT}"
