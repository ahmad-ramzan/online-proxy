#!/bin/bash
# ProxyGPT Online - Linux Deployment Script
# Usage: ./scripts/deploy-linux.sh

set -e

echo "🚀 ProxyGPT Online - Linux Deployment Script"
echo "=============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="${APP_DIR:-.}"
NODE_ENV="${NODE_ENV:-production}"

echo -e "${YELLOW}Configuration:${NC}"
echo "App Directory: $APP_DIR"
echo "Environment: $NODE_ENV"

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm --version)${NC}"

if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠ PM2 not found, installing globally...${NC}"
    npm install -g pm2
fi
echo -e "${GREEN}✓ PM2 installed${NC}"

# Stop existing application
echo -e "\n${YELLOW}Stopping existing application...${NC}"
if pm2 info proxygpt > /dev/null 2>&1; then
    pm2 stop proxygpt
    echo -e "${GREEN}✓ Application stopped${NC}"
else
    echo -e "${YELLOW}ℹ No running application found${NC}"
fi

# Navigate to app directory
cd "$APP_DIR"
echo -e "\n${YELLOW}Working directory: $(pwd)${NC}"

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Build application
echo -e "\n${YELLOW}Building application...${NC}"
npm run build
echo -e "${GREEN}✓ Build successful${NC}"

# Create data directory if not exists
echo -e "\n${YELLOW}Setting up data directory...${NC}"
mkdir -p data
chmod 755 data
echo -e "${GREEN}✓ Data directory ready${NC}"

# Start application with PM2
echo -e "\n${YELLOW}Starting application with PM2...${NC}"
pm2 start ecosystem.config.cjs
echo -e "${GREEN}✓ Application started${NC}"

# Configure PM2 startup
echo -e "\n${YELLOW}Configuring PM2 startup...${NC}"
pm2 startup
pm2 save
echo -e "${GREEN}✓ PM2 startup configured${NC}"

# Display status
echo -e "\n${YELLOW}Application Status:${NC}"
pm2 status

echo -e "\n${GREEN}✅ Deployment complete!${NC}"
echo -e "\nUseful commands:"
echo "  pm2 logs proxygpt          - View application logs"
echo "  pm2 monit                  - Monitor resources"
echo "  pm2 restart proxygpt       - Restart application"
echo "  pm2 stop proxygpt          - Stop application"

# Show URL
echo -e "\n${YELLOW}Access your application at:${NC}"
echo "  Local: http://localhost:3000"
echo "  Production: https://yourdomain.com (after DNS/SSL setup)"
