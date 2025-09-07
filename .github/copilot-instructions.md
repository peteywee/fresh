# GPT Assistant Scheduler — Copilot Instructions

**ALWAYS follow these instructions first.** Only fallback to additional search and context gathering if the information here is incomplete or found to be in error.

## Architecture Overview

This is a TypeScript monorepo using pnpm workspaces with:
- `apps/web`: Next.js 15+ UI (App Router, server/client components, custom session logic)
- `services/api`: Express API (task orchestration, onboarding, demo data)
- `packages/types`: Shared Zod schemas and TypeScript types

**Data contracts:** All cross-service types/schemas live in `packages/types` and are imported with explicit `.js` extensions for NodeNext ESM compatibility.

## Working Effectively

### Bootstrap, Build, and Test (VALIDATED COMMANDS)
Run these commands in order - all have been validated to work:

1. **Install dependencies:**
   ```bash
   pnpm install --frozen-lockfile
   ```
   - Takes ~50 seconds. NEVER CANCEL. Set timeout to 120+ seconds.

2. **Build all packages (REQUIRED before typecheck):**
   ```bash
   pnpm build
   ```
   - Takes ~25 seconds. NEVER CANCEL. Set timeout to 60+ seconds.
   - Must build types package first, then API and Web in parallel
   - Next.js warnings about `outputFileTracingRoot` are expected

3. **Typecheck (run AFTER build):**
   ```bash
   pnpm typecheck
   ```
   - Takes ~4 seconds after build completes
   - Will FAIL if run before build due to missing generated types

4. **Lint:**
   ```bash
   pnpm lint
   ```
   - Takes ~2 seconds. Covers all TypeScript files in all packages.

5. **Test:**
   ```bash
   pnpm test
   ```
   - Takes <1 second. No tests exist yet - add tests in `/tests` or per package.

### Development Servers

**CRITICAL: API server requires PORT environment variable to use port 3333:**

1. **Start API server:**
   ```bash
   PORT=3333 pnpm dev:api
   ```
   - Runs on http://localhost:3333
   - Health check: `curl -s http://localhost:3333/health`
   - Available endpoints: `/health`, `/api/register`, `/api/forgot-password`

2. **Start Web server:**
   ```bash
   pnpm dev:web
   ```
   - Runs on http://localhost:3000
   - Next.js dev server with hot reload

3. **Process management (use these scripts):**
   ```bash
   pnpm dev:restart    # Full restart with health checks
   pnpm dev:kill       # Kill all dev processes
   pnpm dev:status     # Check what's running
   ```
   - The dev:status script has some issues but dev:kill and individual servers work

## Validation Scenarios

**ALWAYS validate changes by testing these scenarios:**

### Manual Web Application Testing
1. **Login page loads correctly:**
   ```bash
   curl -s http://localhost:3000/login | grep -q "Login" && echo "✅ Login page works"
   ```
   - Should render form with Email, Password fields and Login/Register/Forgot Password buttons

2. **API health check:**
   ```bash
   curl -s http://localhost:3333/health | jq . | grep "ok"
   ```
   - Should return `{"ok": true}`

3. **Full build pipeline:**
   ```bash
   pnpm build && pnpm typecheck && pnpm lint
   ```
   - All must succeed for CI to pass

### CI Validation
Always run these before committing (matches `.github/workflows/ci.yml`):
```bash
pnpm build        # NEVER CANCEL - takes 25s, set 60s timeout
pnpm typecheck    # Run after build
pnpm lint         # Must pass for CI
```

## Key Patterns & Development Notes

- **TypeScript ESM:** All imports between packages use explicit `.js` extensions:
  ```ts
  import { Organization } from "../../../packages/types/src/onboarding.js";
  ```
- **Session management:** See `apps/web/lib/session.ts` for custom cookie/session logic
- **Next.js structure:** Uses App Router with `app/` directory (not `src/`)
- **Process management:** Extensive scripts in `scripts/` directory for dev workflow
- **VS Code integration:** Tasks defined in `.vscode/tasks.json` for development workflow

## Common File Locations

### Repository Structure
```
/home/runner/work/fresh/fresh/
├── apps/web/                 # Next.js application
│   ├── app/                  # Next.js App Router pages
│   ├── lib/                  # Web utilities (session.ts)
│   └── middleware.ts         # Next.js middleware
├── services/api/             # Express API server
│   └── src/index.ts          # Main API routes
├── packages/types/           # Shared TypeScript types
│   └── src/                  # Zod schemas and exports
├── scripts/                  # Development process management
├── docs/                     # Documentation
└── .vscode/tasks.json        # VS Code development tasks
```

### Frequently Modified Files
- `packages/types/src/index.ts` - Add new Zod schemas here
- `services/api/src/index.ts` - Add new API endpoints
- `apps/web/app/` - Next.js pages and routes

## Documentation Generation

```bash
npx typedoc --out docs/API packages
```
- Generates API docs in `docs/API/`
- Has warnings but produces working documentation

## Important Build Dependencies

- **Node.js**: 20.19.4 (validated)
- **pnpm**: 10+ required 
- **TypeScript**: 5.5.4 across all packages
- **Next.js**: 15.5.2
- **Express**: 4.20.0

## Troubleshooting

- **Port conflicts (EADDRINUSE):** Use `pnpm dev:kill` then restart
- **Typecheck errors:** Always run `pnpm build` first to generate types
- **API server on wrong port:** Set `PORT=3333` environment variable
- **Lint pattern errors:** Web app uses `app/` and `lib/` directories, not `src/`
