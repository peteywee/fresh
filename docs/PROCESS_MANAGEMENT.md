# Fresh Development Process Management

This document describes the process management tools available for the Fresh development environment.

## Problem Solved

During development, you may encounter issues where:

- Development servers get stuck or become unresponsive
- Ports remain occupied after stopping servers improperly
- You need to "kill processes then restart terminal" manually
- Multiple restarts are needed to get a clean development environment

The scripts in this repository solve these problems by providing automated process management.

## Available Scripts

### 🛑 Kill Development Processes

```bash
# Kill all development processes and free ports
./scripts/kill-dev-processes.sh
# or
pnpm dev:kill
```

This script:

- Finds and kills Next.js development servers
- Terminates package manager dev processes (pnpm/npm/yarn dev)
- Kills processes using common development ports (3000, 3001, 3333)
- Stops TypeScript watchers and other development tools
- Uses graceful termination (SIGTERM) followed by force kill (SIGKILL) if needed

### 🚀 Full Development Restart

```bash
# Complete restart with health checks
./scripts/restart-dev.sh
# or
pnpm dev:restart
```

This script:

- Kills existing development processes
- Starts API server (port 3333) with health check
- Starts Web server (port 3000) with health check
- Waits for both servers to be fully ready
- Provides detailed status and log file locations

### ⚡ Quick Restart

```bash
# Faster restart without extensive health checks
./scripts/quick-restart.sh
# or
pnpm dev:quick-restart
```

This script:

- Quickly stops existing processes on ports 3000 and 3333
- Immediately restarts both servers
- Minimal health checking for faster turnaround

### 📊 Development Status

```bash
# Check status of development environment
./scripts/dev-status.sh
# or
pnpm dev:status
```

This script shows:

- Which development servers are running
- Process IDs and port usage
- HTTP health check results
- Log file information
- Available commands and pnpm scripts

## VS Code Integration

Use **Ctrl+Shift+P** (or **Cmd+Shift+P** on Mac) → **Tasks: Run Task** to access:

- **🚀 Start Development Environment** - Full restart with health checks
- **⚡ Quick Restart Development** - Fast restart
- **🛑 Kill Development Processes** - Kill all dev processes
- **📊 Development Status** - Check environment status
- **🌐 Start Web Only** - Start just the web server
- **🔧 Start API Only** - Start just the API server
- **🔨 Build All** - Build all packages
- **🔍 Type Check** - Run TypeScript checking

## Common Workflows

### Starting Development

```bash
# Option 1: Full restart (recommended)
pnpm dev:restart

# Option 2: Individual servers
pnpm dev:api    # Terminal 1
pnpm dev:web    # Terminal 2
```

### When Things Go Wrong

```bash
# Kill everything and restart fresh
pnpm dev:kill
pnpm dev:restart

# Check what's running
pnpm dev:status
```

### Quick Iteration

```bash
# For rapid development cycles
pnpm dev:quick-restart
```

## Log Files

Development logs are written to:

- `logs/api.log` - API server logs
- `logs/web.log` - Web server logs

## Port Usage

- **3000** - Next.js Web application
- **3333** - Express API server
- **3001** - Alternative API port (if 3333 is busy)

## Troubleshooting

### Port Already in Use

```bash
# Find what's using a port
lsof -i :3000

# Kill everything and restart
pnpm dev:kill
pnpm dev:restart
```

### Processes Won't Die

The kill script uses escalating force:

1. SIGTERM (graceful shutdown)
2. Wait 2 seconds
3. SIGKILL (force terminate)

### Health Checks Failing

- Check log files in `logs/` directory
- Verify no other services are using ports 3000/3333
- Ensure all dependencies are installed (`pnpm install`)

## Development Best Practices

1. **Always clean up**: Use `pnpm dev:kill` before shutting down
2. **Check status**: Run `pnpm dev:status` when unsure what's running
3. **Use full restart**: When in doubt, use `pnpm dev:restart`
4. **Monitor logs**: Check `logs/*.log` files for errors
5. **VS Code tasks**: Use tasks for consistent workflow

This eliminates the need to manually kill processes or restart terminals!
