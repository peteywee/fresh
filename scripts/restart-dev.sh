#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Restarting Fresh development environment..."

# Change to project root
cd "$(dirname "$0")/.."

# Kill any existing development processes
echo "Step 1: Cleaning up existing processes..."
./scripts/kill-dev-processes.sh

# Wait a moment for processes to fully terminate
sleep 3

echo ""
echo "Step 2: Starting development servers..."

# Function to start a development server in background
start_dev_server() {
    local name="$1"
    local command="$2"
    local port="$3"
    local log_file="$4"
    
    echo "🟢 Starting $name on port $port..."
    eval "$command" > "$log_file" 2>&1 &
    local pid=$!
    echo "   PID: $pid, Logs: $log_file"
    
    # Give the server a moment to start
    sleep 2
    
    # Check if the process is still running
    if kill -0 "$pid" 2>/dev/null; then
        echo "✅ $name started successfully"
    else
        echo "❌ Failed to start $name. Check logs: $log_file"
        return 1
    fi
}

# Create logs directory
mkdir -p logs

# Start API server
start_dev_server "API Server" "pnpm --filter @services/api dev" "3333" "logs/api.log"

# Wait for API to be ready
echo "⏳ Waiting for API server to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3333/health > /dev/null 2>&1; then
        echo "✅ API server is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ API server failed to start within 30 seconds"
        exit 1
    fi
    sleep 1
done

# Start Web server
start_dev_server "Web Server" "pnpm --filter @apps/web dev" "3000" "logs/web.log"

# Wait for Web to be ready
echo "⏳ Waiting for Web server to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Web server is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Web server failed to start within 30 seconds"
        exit 1
    fi
    sleep 1
done

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