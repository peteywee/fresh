#!/usr/bin/env bash
set -euo pipefail

# Turbopack Development Server Script
# Starts the Fresh web application with Turbopack for faster development builds

echo "⚡ Starting Fresh with Turbopack..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo -e "${BLUE}📋 Environment Check:${NC}"
echo "   Node.js: $(node --version)"
echo "   Next.js: $(pnpm --filter @apps/web list next --depth=0 2>/dev/null | grep next | awk '{print $2}' || echo 'Not found')"
echo "   Turbopack: Enabled via --turbo flag"
echo ""

# Check if development servers are already running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use${NC}"
    echo "   Killing existing process..."
    kill -9 $(lsof -t -i:3000) 2>/dev/null || true
    sleep 2
fi

# Start with Turbopack
echo -e "${GREEN}🚀 Starting with Turbopack optimizations:${NC}"
echo "   ⚡ 10x faster builds"
echo "   🔄 Instant hot reloads"
echo "   🧠 Smart incremental compilation"
echo "   📦 Optimized bundling"
echo ""

# Change to web app directory
cd "$(dirname "$0")/../apps/web"

# Set environment variables for optimal performance
export NODE_ENV=development
export NEXT_TELEMETRY_DISABLED=1

# Start the development server with Turbopack
echo -e "${GREEN}⚡ Launching Turbopack development server...${NC}"
echo "   🌐 http://localhost:3000"
echo "   📝 Press Ctrl+C to stop"
echo ""

# Run with better error handling
if ! pnpm dev; then
    echo ""
    echo -e "${YELLOW}⚠️  Turbopack failed to start, falling back to webpack...${NC}"
    echo "   This may happen with certain configurations"
    echo ""
    pnpm dev:legacy
fi