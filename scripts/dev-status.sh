#!/usr/bin/env bash
set -euo pipefail

echo "📊 Fresh Development Environment Status"
echo "======================================"

# Function to check if a port is in use
check_port() {
    local port="$1"
    local name="$2"
    local pid
    
    pid=$(lsof -t -i:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        echo "🟢 $name (Port $port): Running (PID: $pid)"
        return 0
    else
        echo "🔴 $name (Port $port): Not running"
        return 1
    fi
}

# Function to check HTTP endpoint
check_http() {
    local url="$1"
    local name="$2"
    
    if curl -s "$url" > /dev/null 2>&1; then
        echo "✅ $name: Responding"
        return 0
    else
        echo "❌ $name: Not responding"
        return 1
    fi
}

# Check development servers
echo ""
echo "📍 Development Servers:"
check_port 3000 "Web Server"
check_port 3333 "API Server"

echo ""
echo "🌐 HTTP Health Checks:"
if check_port 3000 "Web Server" > /dev/null; then
    check_http "http://localhost:3000" "Web Server"
fi

if check_port 3333 "API Server" > /dev/null; then
    check_http "http://localhost:3333/health" "API Health"
fi

# Check for common development processes
echo ""
echo "🔍 Development Processes:"
dev_processes=$(ps aux | grep -E "(next|pnpm.*dev|npm.*dev)" | grep -v grep || true)
if [ -n "$dev_processes" ]; then
    echo "$dev_processes" | while IFS= read -r line; do
        echo "   📦 $line"
    done
else
    echo "   No development processes found"
fi

# Check log files
echo ""
echo "📝 Log Files:"
if [ -f "logs/api.log" ]; then
    api_size=$(wc -l < logs/api.log 2>/dev/null || echo "0")
    echo "   📄 API Log: $api_size lines (logs/api.log)"
else
    echo "   📄 API Log: Not found"
fi

if [ -f "logs/web.log" ]; then
    web_size=$(wc -l < logs/web.log 2>/dev/null || echo "0")
    echo "   📄 Web Log: $web_size lines (logs/web.log)"
else
    echo "   📄 Web Log: Not found"
fi

# Show available commands
echo ""
echo "🛠️  Available Commands:"
echo "   ./scripts/kill-dev-processes.sh  - Kill all development processes"
echo "   ./scripts/restart-dev.sh         - Full restart (with health checks)"
echo "   ./scripts/quick-restart.sh       - Quick restart (faster)"
echo "   ./scripts/dev-status.sh          - Show this status (current script)"

# Show pnpm commands
echo ""
echo "📦 pnpm Commands:"
echo "   pnpm dev:web                     - Start web server only"
echo "   pnpm dev:api                     - Start API server only"
echo "   pnpm build                       - Build all packages"
echo "   pnpm typecheck                   - Check TypeScript types"