#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Finding development processes to kill..."

# Function to kill processes by name/pattern
kill_processes() {
    local pattern="$1"
    local description="$2"
    local pids
    
    pids=$(ps aux | grep -E "$pattern" | grep -v grep | awk '{print $2}' | xargs || true)
    
    if [ -n "$pids" ]; then
        echo "🔴 Killing $description processes: $pids"
        echo "$pids" | xargs kill -TERM 2>/dev/null || true
        sleep 2
        # Force kill if still running
        echo "$pids" | xargs kill -KILL 2>/dev/null || true
        echo "✅ Killed $description processes"
    else
        echo "✅ No $description processes found"
    fi
}

# Kill development servers
kill_processes "next-server|next dev" "Next.js development server"
kill_processes "pnpm.*dev|npm.*dev|yarn.*dev" "Package manager dev scripts"
kill_processes "node.*3000|node.*3001|node.*3333" "Development servers (ports 3000, 3001, 3333)"
kill_processes "tsx.*watch|nodemon|ts-node.*watch" "TypeScript/Node.js watchers"

# Kill processes by port (common development ports)
echo "🔍 Checking for processes on common development ports..."

for port in 3000 3001 3333 4000 5000 8000; do
    pid=$(lsof -t -i:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        echo "🔴 Killing process on port $port: $pid"
        kill -TERM "$pid" 2>/dev/null || true
        sleep 1
        kill -KILL "$pid" 2>/dev/null || true
        echo "✅ Killed process on port $port"
    fi
done

echo "🧹 All development processes have been cleaned up!"
echo "💡 You can now restart your development servers."