#!/usr/bin/env bash
set -euo pipefail

echo "🔄 Quick development environment restart..."

# Change to project root
cd "$(dirname "$0")/.."

# Function to check if a process is using a port
port_in_use() {
    lsof -t -i:$1 > /dev/null 2>&1
}

# Function to wait for port to be free
wait_for_port_free() {
    local port="$1"
    local timeout="${2:-10}"
    
    for i in $(seq 1 $timeout); do
        if ! port_in_use "$port"; then
            return 0
        fi
        sleep 1
    done
    return 1
}

# Function to wait for port to be occupied (service ready)
wait_for_port_ready() {
    local port="$1"
    local timeout="${2:-30}"
    
    for i in $(seq 1 $timeout); do
        if port_in_use "$port"; then
            return 0
        fi
        sleep 1
    done
    return 1
}

# Kill existing processes gracefully
echo "🛑 Stopping existing development servers..."

# Find and kill processes on development ports
for port in 3000 3333; do
    if port_in_use "$port"; then
        echo "   Stopping process on port $port..."
        pid=$(lsof -t -i:$port 2>/dev/null || true)
        if [ -n "$pid" ]; then
            kill -TERM "$pid" 2>/dev/null || true
            if ! wait_for_port_free "$port" 5; then
                echo "   Force killing process on port $port..."
                kill -KILL "$pid" 2>/dev/null || true
                wait_for_port_free "$port" 3
            fi
        fi
    fi
done

echo "✅ All servers stopped"

# Wait a moment for cleanup
sleep 1

echo ""
echo "🚀 Starting development servers..."

# Start API server in background
echo "   Starting API server..."
pnpm --filter @services/api dev > logs/api.log 2>&1 &
api_pid=$!

# Wait for API to be ready
if wait_for_port_ready 3333 20; then
    echo "✅ API server ready on http://localhost:3333"
else
    echo "❌ API server failed to start"
    kill $api_pid 2>/dev/null || true
    exit 1
fi

# Start Web server in background
echo "   Starting Web server..."
pnpm --filter @apps/web dev > logs/web.log 2>&1 &
web_pid=$!

# Wait for Web to be ready
if wait_for_port_ready 3000 20; then
    echo "✅ Web server ready on http://localhost:3000"
else
    echo "❌ Web server failed to start"
    kill $api_pid $web_pid 2>/dev/null || true
    exit 1
fi

echo ""
echo "🎉 Development environment restarted successfully!"
echo ""
echo "📋 Services:"
echo "   • Web:    http://localhost:3000"
echo "   • API:    http://localhost:3333"
echo ""
echo "🔍 Process IDs:"
echo "   • API:    $api_pid"
echo "   • Web:    $web_pid"