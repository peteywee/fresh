#!/usr/bin/env bash
set -euo pipefail

echo "📊 Fresh Development Environment Status"
echo "======================================="

# Check API server
echo -n "🔧 API Server (port 3333): "
if curl -s http://localhost:3333/health >/dev/null 2>&1; then
  echo "✅ Running"
else
  echo "❌ Not running"
fi

# Check Web server
echo -n "🌐 Web Server (port 3000): "
if curl -s http://localhost:3000 >/dev/null 2>&1; then
  echo "✅ Running"
  # Check if running with Turbopack
  if pgrep -f "next dev.*--turbo" >/dev/null 2>&1; then
    echo "   ⚡ Turbopack enabled"
  elif pgrep -f "next dev" >/dev/null 2>&1; then
    echo "   📦 Webpack mode"
  fi
else
  echo "❌ Not running"
fi

# Check processes
echo ""
echo "🔍 Active Processes:"
echo "-------------------"
pgrep -fl "next dev|tsx watch|pnpm.*dev" || echo "No development processes found"

# Check ports
echo ""
echo "🔌 Port Usage:"
echo "-------------"
for port in 3000 3333; do
  if lsof -ti tcp:$port >/dev/null 2>&1; then
    echo "Port $port: ✅ In use"
  else
    echo "Port $port: ⭕ Available"
  fi
done

# Check log files
echo ""
echo "📝 Log Files:"
echo "------------"
if [ -f logs/api.log ]; then
  echo "API log: ✅ Available ($(wc -l < logs/api.log) lines)"
else
  echo "API log: ❌ Not found"
fi

if [ -f logs/web.log ]; then
  echo "Web log: ✅ Available ($(wc -l < logs/web.log) lines)" 
else
  echo "Web log: ❌ Not found"
fi
