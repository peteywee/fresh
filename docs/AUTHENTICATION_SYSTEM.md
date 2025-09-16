# Fresh Authentication System - Updated Documentation

## Overview

The Fresh application uses a modern, PWA-optimized authentication system built on Firebase Authentication with custom session management. This system has been completely refactored from a flags-based approach to a session API-based architecture for optimal performance.

## Architecture

### Session Management Flow
1. **Client Login**: User authenticates via Firebase Auth
2. **Token Exchange**: Firebase ID token exchanged for session cookie via `/api/session/login`
3. **Session Storage**: Secure HTTPOnly session cookie (`__session`) stored
4. **Session Validation**: Client-side calls `/api/session/current` for user state
5. **Middleware Routing**: Lightweight session existence check for route protection

### Key Components

#### 1. Middleware (`apps/web/middleware.ts`)
**Purpose**: Ultra-fast route protection and auth routing
**Performance**: <5ms execution time (PWA standard)
**Logic**: Synchronous session cookie existence check only

```typescript
// Simple session check - no HTTP calls, no async operations
const hasSession = !!req.cookies.get('__session')?.value;
```

#### 2. Session API (`apps/web/app/api/session/`)
- `current/route.ts`: Get current user session data
- `login/route.ts`: Exchange Firebase token for session cookie  
- `logout/route.ts`: Clear session and redirect

#### 3. Client Session Hook (`apps/web/lib/useSession.ts`)
**Purpose**: Client-side session state management
**Method**: Fetches from `/api/session/current` endpoint
**Usage**: Provides user state, onboarding status, role info

#### 4. Server Session (`apps/web/lib/session.ts`)
**Purpose**: Server-side session verification using Firebase Admin SDK
**Usage**: API routes that need verified user data

## Authentication Flow

### Login Process
1. User submits credentials on `/login`
2. Firebase Auth validates credentials
3. Client gets Firebase ID token
4. POST to `/api/session/login` with ID token
5. Server verifies token and creates session cookie
6. Client redirected to dashboard
7. Middleware allows access based on session cookie

### Route Protection
```typescript
// Public routes (no auth required)
['/login', '/register', '/forgot-password', '/reset-password']

// Protected routes (require session)
['/dashboard', '/team', '/calendar', '/admin', '/onboarding']
```

### Session Validation
- **Middleware**: Fast cookie existence check
- **Client**: Detailed session data via API
- **Server**: Full verification for sensitive operations

## Performance Optimizations

### PWA Performance Standards
- **Middleware Execution**: <5ms (achieved)
- **Page Load (Cached)**: <100ms (target)
- **Page Load (Fresh)**: <800ms (target)
- **API Response**: <50ms local (target)

### Key Optimizations Applied
1. **Eliminated HTTP calls from middleware** (was 5000ms+, now <5ms)
2. **Simplified route matching** with optimized regex
3. **Synchronous cookie checks** instead of async session validation
4. **Client-side session management** for complex state
5. **Dynamic imports** for Firebase to reduce bundle size

### Bundle Optimization
- Firebase Auth: Dynamically imported on-demand
- Session validation: Separated from critical path
- Middleware: Minimal code footprint

## Development Workflow

### Starting Development Servers
```bash
# Start both API and Web servers
pnpm dev

# Individual servers
pnpm dev:api  # Port 3333
pnpm dev:web  # Port 3000
```

### Performance Testing
```bash
# Run performance test suite
./scripts/test-performance.sh

# Manual testing
curl -w "Total: %{time_total}s\n" http://localhost:3000/login
```

### Demo Credentials
- Email: `admin@fresh.com`
- Password: `demo123`
- Invite Code: Auto-generated (check API logs)

## Security Features

### Session Security
- HTTPOnly cookies (XSS protection)
- Secure flag in production (HTTPS only)
- SameSite=Lax (CSRF protection)
- Firebase Admin SDK verification
- Automatic expiration handling

### Route Protection
- Middleware-level authentication checks
- Role-based access control (client-side)
- Onboarding flow enforcement
- Public route exclusions

## API Reference

### Session Endpoints
```
GET  /api/session/current   # Get current user session
POST /api/session/login     # Exchange Firebase token for session
POST /api/session/logout    # Clear session
```

### Response Format
```typescript
// Successful session
{
  success: true,
  loggedIn: true,
  user: {
    id: string,
    email: string,
    displayName: string,
    role: string,
    orgId: string,
    orgName: string,
    onboardingComplete: boolean
  }
}

// No session
{
  success: false,
  loggedIn: false
}
```

## Monitoring and Debugging

### Performance Monitoring
- Performance test script: `/scripts/test-performance.sh`
- PWA standards: `/docs/PWA_PERFORMANCE_STANDARDS.md`
- Core Web Vitals tracking ready

### Debug Endpoints
```
GET /api/debug/flags  # Session debugging (now shows session data)
```

### Common Issues
1. **Slow performance**: Check middleware isn't making HTTP calls
2. **Redirect loops**: Verify public routes are excluded from protection
3. **Session not persisting**: Check cookie settings and Firebase config
4. **Hydration errors**: Ensure form elements have `suppressHydrationWarning`

## Migration Notes

### Changes from Flags System
- **Removed**: FLAGS_COOKIE usage throughout application
- **Added**: Session API endpoints for state management
- **Improved**: Middleware performance from 5000ms+ to <5ms
- **Enhanced**: PWA-compliant architecture

### Breaking Changes
- Client code now uses `useSession` hook instead of parsing flags cookie
- Middleware no longer provides detailed user state (client-side only)
- Session validation happens via API calls, not cookie parsing

## Production Deployment

### Environment Variables
```env
SESSION_COOKIE_NAME=__session
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

### Production Checklist
- [ ] Firebase Auth configured
- [ ] Session cookie settings secure
- [ ] Performance monitoring enabled
- [ ] Core Web Vitals tracked
- [ ] Service Worker implemented
- [ ] Offline functionality tested

---

**Last Updated**: September 15, 2025  
**Performance Standard**: PWA-Compliant (<5ms middleware, <100ms page loads)  
**Architecture**: Session API-based with Firebase Authentication