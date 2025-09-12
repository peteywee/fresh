#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Finding development processes to kill..."

# Function to kill processes by pattern
kill_processes() {
  local pattern="$1"
  local description="$2"
  local pids
  pids=$(pgrep -f "$pattern" || true)
  if [ -n "$pids" ]; then
    echo "🔴 Killing $description processes: $pids"
    kill -TERM $pids 2>/dev/null || true
    sleep 2
    # Force kill if still running
    pids=$(pgrep -f "$pattern" || true)
    if [ -n "$pids" ]; then
      kill -9 $pids 2>/dev/null || true
    fi
    echo "✅ Killed $description processes"
  else
    echo "✅ No $description processes found"
  fi
}

# Kill Next.js development processes
kill_processes "next dev" "Next.js development server"

# Kill package manager dev processes
kill_processes "pnpm.*dev" "Package manager dev scripts"

# Kill processes by port
for port in 3000 3001 3333; do
  echo "🔍 Checking for processes on port $port..."
  pids=$(lsof -ti tcp:$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "🔴 Killing process on port $port: $pids"
    kill -9 $pids 2>/dev/null || true
    echo "✅ Killed process on port $port"
  else
    echo "✅ No processes found on port $port"
  fi
done

# Kill TypeScript/Node watchers
kill_processes "tsx watch" "TypeScript/Node.js watchers"

echo ""
echo "🧹 All development processes have been cleaned up!"
echo "💡 You can now restart your development servers."
