# Fresh — GitHub Copilot Instructions

# Fresh — GitHub Copilot Instructions

**ALWAYS follow these instructions first.** Only fallback to additional search and context gathering if the information here is incomplete or found to be in error.

## Project Overview

Fresh is a modern PWA-compliant scheduler application built with TypeScript, Firebase, and Next.js. This is a production-grade monorepo using pnpm workspaces with advanced authentication, performance monitoring, and full-stack type safety.

## Project Overview

Fresh is a modern PWA-compliant scheduler application built with TypeScript, Firebase, and Next.js. This is a production-grade monorepo using pnpm workspaces with advanced authentication, performance monitoring, and full-stack type safety.

### Repository Structure

### Repository Structure

- `apps/web`: Next.js 15+ UI (App Router, server/client components, Firebase auth, PWA features)
- `apps/web`: Next.js 15+ UI (App Router, server/client components, Firebase auth, PWA features)
- `services/api`: Express API (task orchestration, onboarding, demo data)
- `packages/types`: Shared Zod schemas and TypeScript types
- `scripts/`: Development automation and process management
- `docs/`: Comprehensive technical documentation
- `scripts/`: Development automation and process management
- `docs/`: Comprehensive technical documentation

**Data contracts:** All cross-service types/schemas live in `packages/types` and are imported with explicit `.js` extensions for NodeNext ESM compatibility.

### Key Technologies

- **Frontend**: Next.js 15+, React 19+, TypeScript 5.5+
- **Authentication**: Firebase Auth with custom session management
- **Database**: Firestore (Firebase Admin SDK + client SDK)
- **Validation**: Zod schemas for all data contracts
- **Performance**: PWA standards, Core Web Vitals tracking
- **Package Management**: pnpm with workspace configuration

## Development Workflow

### Required Commands (VALIDATED - never cancel these)

### Key Technologies

- **Frontend**: Next.js 15+, React 19+, TypeScript 5.5+
- **Authentication**: Firebase Auth with custom session management
- **Database**: Firestore (Firebase Admin SDK + client SDK)
- **Validation**: Zod schemas for all data contracts
- **Performance**: PWA standards, Core Web Vitals tracking
- **Package Management**: pnpm with workspace configuration

## Development Workflow

### Required Commands (VALIDATED - never cancel these)

Run these commands in order - all have been validated to work in CI/CD:
Run these commands in order - all have been validated to work in CI/CD:

1. **Install dependencies (50s runtime):**

1. **Install dependencies (50s runtime):**

   ```bash
   pnpm install --frozen-lockfile
   ```

   - Set timeout to 120+ seconds. NEVER CANCEL.
   - Uses pnpm workspace configuration

   - Set timeout to 120+ seconds. NEVER CANCEL.
   - Uses pnpm workspace configuration

1. **Build all packages (25s runtime):**

1. **Build all packages (25s runtime):**

   ```bash
   pnpm build
   ```

   - Set timeout to 60+ seconds. NEVER CANCEL.
   - Set timeout to 60+ seconds. NEVER CANCEL.
   - Must build types package first, then API and Web in parallel
   - Next.js warnings about `outputFileTracingRoot` are expected

1. **TypeScript validation (4s runtime):**

1. **TypeScript validation (4s runtime):**

   ```bash
   pnpm typecheck
   ```

   - MUST run AFTER build due to generated types dependency
   - Will FAIL if run before build
   - MUST run AFTER build due to generated types dependency
   - Will FAIL if run before build

1. **Linting (2s runtime):**

1. **Linting (2s runtime):**

   ```bash
   pnpm lint
   ```

   - Covers all TypeScript files across monorepo

   - Covers all TypeScript files across monorepo

1. **Testing (<1s runtime):**
1. **Testing (<1s runtime):**

   ```bash
   pnpm test
   ```

   - Vitest configuration, minimal tests currently
   - Vitest configuration, minimal tests currently

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

   - The `dev:status` script has some issues but `dev:kill` and individual servers work
   - The `dev:status` script has some issues but `dev:kill` and individual servers work

## Validation & Testing

### Required Pre-Commit Validation

Always run these before committing (matches `.github/workflows/ci.yml`):

```bash
pnpm build && pnpm typecheck && pnpm lint
```

### Manual Application Testing

## Validation & Testing

### Required Pre-Commit Validation

Always run these before committing (matches `.github/workflows/ci.yml`):

```bash
pnpm build && pnpm typecheck && pnpm lint
```

### Manual Application Testing

1. **Login page verification:**

1. **Login page verification:**

   ```bash
   curl -s http://localhost:3000/login | grep -q "Login" && echo "✅ Login page works"
   ```

   - Should render form with Email, Password fields and Login/Register/Forgot Password buttons

1. **API health check:**
   ```bash
   curl -s http://localhost:3333/health | jq . | grep "ok"
   ```

   - Should return `{"ok": true}`

## Architecture & Authentication

### Session Management System

- **Architecture**: Firebase Auth + custom session cookies (PWA-optimized)
- **Session API**: `/api/session/current`, `/api/session/login`, `/api/session/logout`
- **Middleware**: Ultra-fast cookie existence check (<5ms, no async operations)
- **Server Verification**: Full Firebase session verification via `getServerSession()`

### Key Authentication Files

- `apps/web/lib/session.ts`: Server-side session verification
- `apps/web/lib/firebase.admin.ts`: Firebase Admin SDK initialization
- `apps/web/lib/firebase.client.ts`: Client-side Firebase configuration
- `apps/web/middleware.ts`: Route protection middleware

### Database (Firestore)

- **Admin SDK**: `firebase-admin/firestore` for server operations
- **Client SDK**: Dynamic imports for registration/auth flows
- **Collections**: Users, organizations stored in Firestore
- **Custom Claims**: Set during onboarding for role-based access

## Code Standards & Conventions

### TypeScript Requirements

- **ESM Imports**: All cross-package imports use explicit `.js` extensions:

## Architecture & Authentication

### Session Management System

- **Architecture**: Firebase Auth + custom session cookies (PWA-optimized)
- **Session API**: `/api/session/current`, `/api/session/login`, `/api/session/logout`
- **Middleware**: Ultra-fast cookie existence check (<5ms, no async operations)
- **Server Verification**: Full Firebase session verification via `getServerSession()`

### Key Authentication Files

- `apps/web/lib/session.ts`: Server-side session verification
- `apps/web/lib/firebase.admin.ts`: Firebase Admin SDK initialization
- `apps/web/lib/firebase.client.ts`: Client-side Firebase configuration
- `apps/web/middleware.ts`: Route protection middleware

### Database (Firestore)

- **Admin SDK**: `firebase-admin/firestore` for server operations
- **Client SDK**: Dynamic imports for registration/auth flows
- **Collections**: Users, organizations stored in Firestore
- **Custom Claims**: Set during onboarding for role-based access

## Code Standards & Conventions

### TypeScript Requirements

- **ESM Imports**: All cross-package imports use explicit `.js` extensions:
  ```ts
  import { Organization } from '../../../packages/types/src/onboarding.js';
  ```
- **Strict Mode**: All packages use strict TypeScript configuration
- **Zod Validation**: All data contracts defined in `packages/types` with Zod schemas

### Next.js Patterns

- **App Router**: Uses `app/` directory structure (not `src/`)
- **Server Components**: Default; mark client components with `'use client'`
- **Session Handling**: Always use `getServerSession()` for server-side auth checks
- **Middleware**: Keep ultra-fast (<5ms) with only synchronous cookie checks

### Performance Standards

- **PWA Compliance**: Core Web Vitals tracking, service worker registration
- **Bundle Analysis**: Use `pnpm analyze` for bundle size monitoring
- **Session Performance**: Middleware <5ms, page loads <100ms target

### File Organization Patterns

```
apps/web/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Route groups for auth pages
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # Reusable React components
├── lib/                   # Utility functions and configurations
└── middleware.ts          # Next.js middleware
```

## Common Development Tasks

### Adding New API Endpoints

1. Create route in `apps/web/app/api/[endpoint]/route.ts`
2. Use `getServerSession()` for authentication
3. Validate input with Zod schemas from `packages/types`
4. Return structured JSON responses

### Adding New UI Components

1. Create in `apps/web/components/`
2. Use TypeScript with proper prop types
3. Mark as client component only if needed (`'use client'`)
4. Import shared types from `packages/types/src/index.js`

### Database Operations

1. Use `adminDb()` from `firebase.admin.ts` for server operations
2. Structure data with Zod schemas before Firestore writes
3. Handle errors gracefully with try/catch blocks

### Authentication Flows

1. Client: Use Firebase Auth SDK for login/register
2. Exchange: POST to `/api/session/login` with ID token
3. Session: Server uses `getServerSession()` for verification
4. Logout: POST to `/api/session/logout` to clear session

- **Strict Mode**: All packages use strict TypeScript configuration
- **Zod Validation**: All data contracts defined in `packages/types` with Zod schemas

### Next.js Patterns

- **App Router**: Uses `app/` directory structure (not `src/`)
- **Server Components**: Default; mark client components with `'use client'`
- **Session Handling**: Always use `getServerSession()` for server-side auth checks
- **Middleware**: Keep ultra-fast (<5ms) with only synchronous cookie checks

### Performance Standards

- **PWA Compliance**: Core Web Vitals tracking, service worker registration
- **Bundle Analysis**: Use `pnpm analyze` for bundle size monitoring
- **Session Performance**: Middleware <5ms, page loads <100ms target

### File Organization Patterns

```
apps/web/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Route groups for auth pages
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # Reusable React components
├── lib/                   # Utility functions and configurations
└── middleware.ts          # Next.js middleware
```

## Common Development Tasks

### Adding New API Endpoints

1. Create route in `apps/web/app/api/[endpoint]/route.ts`
2. Use `getServerSession()` for authentication
3. Validate input with Zod schemas from `packages/types`
4. Return structured JSON responses

### Adding New UI Components

1. Create in `apps/web/components/`
2. Use TypeScript with proper prop types
3. Mark as client component only if needed (`'use client'`)
4. Import shared types from `packages/types/src/index.js`

### Database Operations

1. Use `adminDb()` from `firebase.admin.ts` for server operations
2. Structure data with Zod schemas before Firestore writes
3. Handle errors gracefully with try/catch blocks

### Authentication Flows

1. Client: Use Firebase Auth SDK for login/register
2. Exchange: POST to `/api/session/login` with ID token
3. Session: Server uses `getServerSession()` for verification
4. Logout: POST to `/api/session/logout` to clear session

## Troubleshooting

### Common Issues & Solutions

### Common Issues & Solutions

- **Port conflicts (EADDRINUSE):** Use `pnpm dev:kill` then restart
- **Typecheck errors:** Always run `pnpm build` first to generate types
- **API server on wrong port:** Set `PORT=3333` environment variable
- **Lint pattern errors:** Web app uses `app/` and `lib/` directories, not `src/`
- **Firebase session errors:** Check environment variables and private key formatting

### Build Dependencies

- **Node.js**: 20.19.4 (validated) - engines specify >=20
- **Firebase session errors:** Check environment variables and private key formatting

### Build Dependencies

- **Node.js**: 20.19.4 (validated) - engines specify >=20<23
- **pnpm**: 10+ required for workspace features
- **TypeScript**: 5.5.4 across all packages
- **Next.js**: 15.5.2 with App Router
- **Firebase**: Admin + client SDK with session management
