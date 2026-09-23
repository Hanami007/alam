#!/bin/bash
# ==============================================================
# 03-seed-database.sh — เช็ค/รัน seed ข้อมูลเริ่มต้นของ alam
# ==============================================================
# ต่างจาก template กลาง: alam ไม่มีระบบ seed แยกต่างหาก
# (ไม่มี dist/database/seeds/run-seed.js แบบ NestJS) — ข้อมูลเริ่มต้น
# (generations, provinces, hof candidates ฯลฯ) ถูกฝังอยู่ใน migration
# files เอง (เช่น migrations/1750000002000_seed-data.js,
# migrations/1750000008000_replace-mock-with-seed-data.js) และรันพร้อม
# migrate:up ใน deploy/02-deploy.sh ไปแล้วโดยอัตโนมัติทุกครั้งที่ deploy
#
# สคริปต์นี้จึงแค่รัน migration อีกครั้งแบบปลอดภัย (idempotent — migration
# ที่เคยรันแล้วจะถูกข้าม) ไว้ใช้กรณีต้องการมั่นใจว่าข้อมูล seed ครบถ้วน
# โดยไม่ต้อง deploy ใหม่ทั้งหมด
#
# วิธีใช้: bash deploy/03-seed-database.sh
# ==============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   alam Database Seed / Migration Check${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════${NC}"
echo ""

if ! docker ps --filter "name=alam-db" --format "{{.Names}}" | grep -q "alam-db"; then
    echo -e "${RED}✗ Container alam-db ไม่ได้ทำงานอยู่${NC}"
    echo -e "${YELLOW}  กรุณารัน deploy ก่อน: bash deploy/02-deploy.sh${NC}"
    exit 1
fi

echo -e "${YELLOW}กำลังรัน migration (รวม seed data ในตัว, ข้ามรายการที่เคยรันแล้ว)...${NC}"
cd "$PROJECT_DIR"
docker compose -f docker-compose.prod.yml --env-file .env run --rm migrate

echo ""
echo -e "${GREEN}✅ เสร็จสิ้น — ตรวจสอบจำนวนข้อมูลได้ด้วย:${NC}"
echo -e "  ${BLUE}docker compose -f docker-compose.prod.yml exec db psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"select count(*) from users;\"${NC}"
