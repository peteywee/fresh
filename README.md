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
- `/team` — Team management & real-time chat
- `/settings` — Industry branding & customization

### API routes (Next.js App Router)

- `POST /api/session/login` — Exchange Firebase ID token for session cookie
- `GET /api/session/current` — Current session/user
- `POST /api/session/logout` — Clear session
- `POST /api/onboarding/complete` — Create org + set custom claims
- `POST /api/onboarding/join` — Join org by invite code (sets claims)
- `GET /api/public/firebase-config` — Public Firebase config (used by service worker)
- `POST /api/team/members` — Create/invite team member
- `PUT /api/team/members/:id` — Update member (name/role)
- `DELETE /api/team/members/:id` — Remove member
- `POST /api/team/bulk-roles` — Bulk role updates
- `POST /api/team/roles` — Single role update + list members

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

## New Features

### Real-Time Team Chat
Implemented with Firebase (Firestore + Messaging) and available on the `/team` page:
- Channel support (general + future expansion)
- Edit/delete messages (role based)
- System messages
- Push notifications via `firebase-messaging-sw.js`
  - Service worker now fetches runtime config from `/api/public/firebase-config` (no hard-coded keys)

### Team Member CRUD
- Add, edit, delete members with role controls
- Bulk role updates with optimistic UI
- Inline role adjustment per member
 - Pending invites represented with `pending:` id prefix until user registers
 - Invite tokens returned on creation for new (unregistered) emails; acceptance via `/api/team/members/accept`

### Industry Branding System
- `BrandingProvider` supplies colors, terminology, feature toggles
- Predefined industries: healthcare, education, corporate, hospitality, fitness, consulting
- Terminology auto-swaps across UI (e.g., “Patient” vs “Employee”)
- `/settings` page to pick industry (persisted in localStorage)

### Environment Variables (Add to `.env.local` for web)
```

NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
SESSION_COOKIE_NAME=\_\_session
FLAGS_COOKIE_NAME=fresh_flags
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
INVITE_TOKEN_SECRET=change-me-please

```

## Testing

Added Vitest tests for branding config and session flag parsing:
```

pnpm test

```
Additional smoke tests cover new member CRUD route module exports.

## Follow Ups / Ideas
- Persist industry choice per organization (server side) instead of localStorage
- Add presence indicators to chat
- Add file attachments in chat
- Paginate older messages (infinite scroll)

  -H 'x-obj: onboarding' \
  -H 'x-task: WT-001' \
  -H 'x-step: AC1' \
  http://localhost:3333/hierarchy/echo | jq .
```
