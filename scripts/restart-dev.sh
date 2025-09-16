#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Restarting Fresh development environment..."

# Step 1: Kill existing processes
echo "Step 1: Cleaning up existing processes..."
./scripts/kill-dev-processes.sh

sleep 2

# Step 2: Start development servers
echo "Step 2: Starting development servers..."

# Start API server
echo "🟢 Starting API Server on port 3333..."
PORT=3333 pnpm --filter @services/api dev > logs/api.log 2>&1 &
API_PID=$!
echo "   PID: $API_PID, Logs: logs/api.log"

# Wait for API to be ready
echo "⏳ Waiting for API server to be ready (port 3333)..."
sleep 3
if curl -s http://localhost:3333/health >/dev/null; then
  echo "✅ API server is ready"
else
  echo "❌ API server failed to start"
  exit 1
fi

# Start Web server
echo "🟢 Starting Web Server on port 3000..."
pnpm --filter @apps/web dev > logs/web.log 2>&1 &
WEB_PID=$!
echo "   PID: $WEB_PID, Logs: logs/web.log"

# Wait for Web server to be ready
echo "⏳ Waiting for Web server to be ready..."
sleep 5
if curl -s http://localhost:3000 >/dev/null; then
  echo "✅ Web server is ready"
else
  echo "❌ Web server failed to start"
  exit 1
fi

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "📋 Services:"
echo "   • Web:    http://localhost:3000"
echo "   • API:    http://localhost:3333"
echo "   • Health: http://localhost:3333/health"
echo ""
echo "📝 Log files:"
echo "   • API:    logs/api.log"
echo "   • Web:    logs/web.log"
echo ""
echo "🛑 To stop all servers, run: ./scripts/kill-dev-processes.sh"
