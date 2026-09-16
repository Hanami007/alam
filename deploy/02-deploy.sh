#!/bin/bash
# ==============================================================
# 02-deploy.sh — Deploy / Update ระบบ alam
# ปรับจาก template กลางให้ตรงกับ alam (Next.js เดี่ยว + Postgres, พอร์ต 4007)
# ==============================================================
# วิธีใช้:
#   bash deploy/02-deploy.sh              # Deploy ปกติ
#   bash deploy/02-deploy.sh --build      # Force rebuild image
#   bash deploy/02-deploy.sh --pull       # git pull ก่อน deploy
# ==============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"
ENV_FILE="$PROJECT_DIR/.env"

DO_BUILD=false
DO_PULL=false
for arg in "$@"; do
    case $arg in
        --build) DO_BUILD=true ;;
        --pull)  DO_PULL=true ;;
        *) echo -e "${RED}Unknown option: $arg${NC}"; exit 1 ;;
    esac
done

echo -e "${BLUE}══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   alam Deploy — อัพเดทระบบ${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════${NC}"
echo ""

if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}✗ ไม่พบ docker-compose.prod.yml ที่: $COMPOSE_FILE${NC}"
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  ไม่พบ .env — กำลังคัดลอกจาก .env.production...${NC}"
    if [ -f "$PROJECT_DIR/.env.production" ]; then
        cp "$PROJECT_DIR/.env.production" "$ENV_FILE"
        echo -e "${YELLOW}  ⚠️  กรุณาแก้ไขค่า secrets ใน .env ก่อน deploy!${NC}"
        echo -e "${YELLOW}  แก้ไขด้วย: nano $ENV_FILE${NC}"
        exit 1
    else
        echo -e "${RED}✗ ไม่พบ .env.production — สร้างก่อน: cp .env.production.example .env.production${NC}"
        exit 1
    fi
fi

# ── 1. Git Pull (ถ้าใช้ --pull) ──
if [ "$DO_PULL" = true ]; then
    echo -e "${YELLOW}[1/4] Git Pull — ดึงโค้ดล่าสุด...${NC}"
    cd "$PROJECT_DIR"
    git pull origin master
    echo -e "${GREEN}✓ Git pull เสร็จสิ้น${NC}"
    echo ""
else
    echo -e "${YELLOW}[1/4] ข้ามขั้นตอน Git Pull (ใช้ --pull เพื่อ pull)${NC}"
    echo ""
fi

# ── 2. สร้างโฟลเดอร์ data ──
echo -e "${YELLOW}[2/4] ตรวจสอบโฟลเดอร์ data...${NC}"
mkdir -p "$PROJECT_DIR/data/db"
mkdir -p "$PROJECT_DIR/data/backups"
echo -e "${GREEN}✓ โฟลเดอร์ data พร้อม${NC}"
echo ""

# ── 3. Deploy ด้วย Docker Compose ──
echo -e "${YELLOW}[3/4] กำลัง Deploy...${NC}"
cd "$PROJECT_DIR"

BUILD_FLAG=""
if [ "$DO_BUILD" = true ]; then
    BUILD_FLAG="--build"
    echo -e "${YELLOW}  → Force rebuild image...${NC}"
fi

docker compose -f docker-compose.prod.yml --env-file .env up -d $BUILD_FLAG
echo -e "${GREEN}✓ Deploy เสร็จสิ้น${NC}"
echo ""

# ── 3.5 รัน Migration (สร้าง/อัปเดตตาราง — รวม seed data ในตัวอยู่แล้ว) ──
echo -e "${YELLOW}[3.5/4] กำลังรัน Migration...${NC}"
# depends_on: condition: service_healthy ใน docker-compose.prod.yml ทำให้คำสั่งนี้
# รอ db พร้อมเองโดยอัตโนมัติ ไม่ต้อง sleep/poll รอเองแบบ manual
if docker compose -f docker-compose.prod.yml --env-file .env run --rm migrate; then
    echo -e "${GREEN}✓ Migration เสร็จสิ้น${NC}"
else
    echo -e "${YELLOW}⚠️  Migration มี warning/error (อาจเคยรันแล้วบางส่วน) — ดู log ด้านบน${NC}"
fi
echo ""

# ── 4. ตรวจสอบสถานะ ──
echo -e "${YELLOW}[4/4] ตรวจสอบสถานะ Containers...${NC}"
echo ""
sleep 3
docker compose -f docker-compose.prod.yml ps
echo ""

UNHEALTHY=$(docker ps --filter "name=alam" --filter "health=unhealthy" --format "{{.Names}}" 2>/dev/null || true)
if [ -n "$UNHEALTHY" ]; then
    echo -e "${RED}✗ Containers ที่มีปัญหา:${NC} $UNHEALTHY"
    echo -e "${YELLOW}ดู logs ด้วย: docker compose -f docker-compose.prod.yml logs <service>${NC}"
else
    echo -e "${GREEN}✓ ทุก Container ทำงานปกติ${NC}"
fi

APP_PORT="$(grep -E '^APP_PORT=' "$ENV_FILE" | tail -1 | cut -d= -f2)"
APP_PORT="${APP_PORT:-4007}"

echo ""
echo -e "${BLUE}══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Deploy เสร็จสิ้น!${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════${NC}"
echo ""
echo -e "📡 เว็บไซต์: ${BLUE}http://$(hostname -I | awk '{print $1}'):${APP_PORT}${NC}"
echo ""
echo -e "คำสั่งที่มีประโยชน์:"
echo -e "  ดู logs    : ${BLUE}docker compose -f docker-compose.prod.yml logs -f${NC}"
echo -e "  หยุดระบบ   : ${BLUE}docker compose -f docker-compose.prod.yml down${NC}"
echo -e "  restart    : ${BLUE}docker compose -f docker-compose.prod.yml restart${NC}"
