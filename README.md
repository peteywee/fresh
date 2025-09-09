# Fresh — GPT Assistant Scheduler

Monorepo (pnpm) with:

- `apps/web` — Next.js UI (App Router, Turbopack dev)
- `services/api` — Express orchestration API
- `packages/types` — Shared types/schemas (Zod-ready)

## Prerequisites

- Node.js 20.19.4
- pnpm 10+

## Quick Start (Turbopack)

- Web (Next.js, Turbopack): `pnpm dev:web`
- API (Express): `PORT=3333 pnpm dev:api`

VS Code tasks are available for full restart, quick restart, kill, and status. See `docs/PROCESS_MANAGEMENT.md` for details.

## Verify before push

Run the comprehensive pre-push validation:

```bash
./scripts/pre-push-check.sh
```

This validates build, typecheck, lint, route consistency, Firebase config, and code quality.

Or run individual checks:

```bash
./scripts/verify-all.sh          # Build, typecheck, lint only
./scripts/test-routes.sh         # Manual testing guide
```

## Route map

- `/` — Login (homepage)
- `/login` — Login (alias)
- `/register` — Create account
- `/forgot-password` — Password reset request
- `/onboarding` — Wizard (Create Org / Join Org)
- `/dashboard` — Post-onboarding landing

### API routes (Next.js App Router)

- `POST /api/session/login` — Exchange Firebase ID token for session cookie
- `GET /api/session/current` — Current session/user
- `POST /api/session/logout` — Clear session
- `POST /api/onboarding/complete` — Create org + set custom claims
- `POST /api/onboarding/join` — Join org by invite code (sets claims)

## Clipboard behavior

Invite code copy uses `navigator.clipboard.writeText` with a fallback to `document.execCommand('copy')` when the Clipboard API is blocked by browser policies.

## CI parity

Local commands that mirror CI:

```bash
pnpm build && pnpm typecheck && pnpm lint
```

## Process management (scripts)

Common flows (see `docs/PROCESS_MANAGEMENT.md`):

- Full restart: `pnpm dev:restart`
- Quick restart: `pnpm dev:quick-restart`
- Kill dev processes: `pnpm dev:kill`
- Status: `pnpm dev:status`

## Health checks

- API: `curl -s http://localhost:3333/health | jq .`
- Probe: `curl -s -H 'x-run-id: run-abc' http://localhost:3333/__/probe | jq .`
- Echo example:

```bash
curl -s \
  -H 'x-run-id: run-abc-001' \
  -H 'x-user: patrick' \
  -H 'x-obj: onboarding' \
  -H 'x-task: WT-001' \
  -H 'x-step: AC1' \
  http://localhost:3333/hierarchy/echo | jq .
```
