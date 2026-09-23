#!/bin/bash
# ==============================================================
# 01-server-setup.sh — ติดตั้ง Docker + เตรียม Server (รันครั้งแรก)
# ปรับจาก template กลางให้ตรงกับ alam (Next.js เดี่ยว + Postgres, พอร์ต 4007)
# ==============================================================
# วิธีใช้: bash deploy/01-server-setup.sh
# ==============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
APP_PORT="${APP_PORT:-4007}"

echo -e "${BLUE}══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   alam Server Setup — ติดตั้งระบบครั้งแรก${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════${NC}"
echo ""

HAS_SUDO=false
if sudo -n true 2>/dev/null || sudo -v 2>/dev/null; then
    HAS_SUDO=true
fi

# ── 1. อัพเดท System Packages ──
echo -e "${YELLOW}[1/5] อัพเดท System Packages...${NC}"
if [ "$HAS_SUDO" = true ]; then
    sudo apt-get update -y || true
    echo -e "${GREEN}✓ อัพเดทเสร็จสิ้น${NC}"
else
    echo -e "${YELLOW}⚠️  ไม่มีสิทธิ์ sudo — ข้ามการอัพเดท system packages${NC}"
fi
echo ""

# ── 2. ติดตั้ง Dependencies ที่จำเป็น ──
echo -e "${YELLOW}[2/5] ติดตั้ง Dependencies...${NC}"
if [ "$HAS_SUDO" = true ]; then
    sudo apt-get install -y ca-certificates curl gnupg lsb-release git htop unzip || true
    echo -e "${GREEN}✓ ติดตั้ง Dependencies เสร็จสิ้น${NC}"
else
    echo -e "${YELLOW}⚠️  ไม่มีสิทธิ์ sudo — ข้ามการติดตั้ง dependencies${NC}"
fi
echo ""

# ── 3. ติดตั้ง/ตรวจสอบ Docker Engine ──
echo -e "${YELLOW}[3/5] ตรวจสอบ Docker Engine...${NC}"
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker ติดตั้งอยู่แล้ว: $(docker --version)${NC}"
else
    if [ "$HAS_SUDO" = true ]; then
        echo -e "${YELLOW}  กำลังติดตั้ง Docker...${NC}"
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        rm get-docker.sh
        sudo usermod -aG docker "$USER" || true
        echo -e "${GREEN}✓ Docker ติดตั้งเสร็จสิ้น${NC}"
    else
        echo -e "${RED}✗ ไม่พบ Docker และไม่มีสิทธิ์ sudo — ขอให้ admin ติดตั้งให้ก่อน${NC}"
    fi
fi

if docker compose version &> /dev/null; then
    echo -e "${GREEN}✓ Docker Compose พร้อมใช้: $(docker compose version --short)${NC}"
else
    echo -e "${RED}✗ ไม่พบ Docker Compose v2 (docker compose)${NC}"
fi
echo ""

# ── 4. สร้างโครงสร้างโฟลเดอร์ข้อมูล ──
echo -e "${YELLOW}[4/5] สร้างโครงสร้างโฟลเดอร์...${NC}"
mkdir -p "$PROJECT_DIR/data/db"
mkdir -p "$PROJECT_DIR/data/backups"
echo -e "  📁 ${PROJECT_DIR}/data/"
echo -e "  ├── 📁 db/        ← PostgreSQL data"
echo -e "  └── 📁 backups/   ← Backup files (pg_dump)"
echo -e "${GREEN}✓ สร้างโฟลเดอร์เสร็จสิ้น${NC}"
echo ""

# ── 5. เปิด Firewall Ports ──
echo -e "${YELLOW}[5/5] ตั้งค่า Firewall...${NC}"
if [ "$HAS_SUDO" = true ] && command -v ufw &> /dev/null; then
    UFW_STATUS=$(sudo ufw status 2>/dev/null | head -1 || echo "")
    if echo "$UFW_STATUS" | grep -q "active"; then
        sudo ufw allow 22/tcp comment "SSH" 2>/dev/null || true
        sudo ufw allow "${APP_PORT}/tcp" comment "alam app" 2>/dev/null || true
        echo -e "${GREEN}✓ เปิด ports: 22 (SSH), ${APP_PORT} (alam app)${NC}"
    else
        echo -e "${YELLOW}  ufw ไม่ได้เปิดใช้งาน — ข้ามขั้นตอนนี้${NC}"
    fi
else
    echo -e "${YELLOW}  ข้ามขั้นตอนเปิด Firewall (ไม่มีสิทธิ์ sudo หรือไม่มี ufw)${NC}"
fi
echo ""

echo -e "${BLUE}══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ เตรียม Server เสร็จสิ้น!${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════${NC}"
echo ""
echo -e "ขั้นตอนถัดไป:"
echo -e "  1. cp .env.production.example .env.production แล้วกรอกค่า secrets จริง"
echo -e "  2. รัน: bash deploy/02-deploy.sh"
echo ""
echo -e "${YELLOW}⚠️  หากเพิ่งติดตั้ง Docker ให้ logout แล้ว login ใหม่ก่อน (หรือรัน: newgrp docker)${NC}"
