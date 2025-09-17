# Fresh Authentication System - Complete Guide

## Overview

Fresh now includes a complete Firebase-based authentication system that supports:

- Google OAuth (popup with redirect fallback)
- Email/Password authentication
- Password reset functionality
- Client-side route protection
- Production-safe configuration

## Quick Start

### 1. Firebase Setup

1. **Create/Configure Firebase Project:**

   ```bash
   # Visit https://console.firebase.google.com
   # Enable Authentication > Sign-in methods:
   # - Email/Password ✅
   # - Google ✅
   ```

2. **Add Authorized Domains:**
   ```
   localhost (for development)
   your-production-domain.com
   your-codespaces-domain.github.dev (if using Codespaces)
   ```

### 2. Environment Configuration

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 3. Start Development

```bash
pnpm dev:web
# Navigate to http://localhost:3000
```

## Authentication Flow

### User Journey

1. **Landing Page (/)**: Protected by `RequireAuth`, redirects to `/login` if not authenticated
2. **Login (/login)**: Google OAuth + Email/Password options
3. **Register (/register)**: Account creation with optional display name
4. **Forgot Password (/forgot-password)**: Password reset via email
5. **Authenticated Home (/)**: Welcome page with sign-out option

### Route Protection

- **Public Routes**: `/login`, `/register`, `/forgot-password`, static assets
- **Protected Routes**: Everything else (protected by `RequireAuth` component)

## Acceptance Criteria Status ✅

| AC  | Description                                  | Status      |
| --- | -------------------------------------------- | ----------- |
| AC1 | Google OAuth + Email/Password login          | ✅ Complete |
| AC2 | Email/Password registration                  | ✅ Complete |
| AC3 | Password reset with success state            | ✅ Complete |
| AC4 | Route protection redirects to login          | ✅ Complete |
| AC5 | Authenticated users redirect from auth pages | ✅ Complete |
| AC6 | Popup blocker fallback to redirect           | ✅ Complete |
| AC7 | Production-safe configuration                | ✅ Complete |

## Architecture

### Client-Side Authentication (MVP)

```typescript
// Client guard for fast MVP development
<RequireAuth>
  <YourProtectedContent />
</RequireAuth>
```

### Firebase Integration

```typescript
// Direct Firebase Auth usage
import { emailSignIn } from '@/lib/auth-email';
import { signInWithGoogle } from '@/lib/auth-google';
import { auth } from '@/lib/firebase.client';
```

## File Structure

```
apps/web/
├── lib/
│   ├── firebase.client.ts      # Firebase SDK config
│   ├── auth-google.ts          # Google OAuth helpers
│   └── auth-email.ts           # Email auth helpers
├── components/
│   └── RequireAuth.tsx         # Route protection
├── app/
│   ├── page.tsx               # Protected home
│   └── (public)/
│       ├── auth.module.css    # Auth styles
│       ├── login/page.tsx     # Login form
│       ├── register/page.tsx  # Registration
│       └── forgot-password/page.tsx
├── middleware.ts              # Public route handling
└── public/icons/google.svg    # Google icon
```

## Error Handling

### Environment Validation

```typescript
// Automatic env validation with helpful messages
Missing NEXT_PUBLIC_FIREBASE_API_KEY. Fill apps/web/.env.local
```

### Authentication Errors

```typescript
// User-friendly error messages
auth/user-not-found → "No account found with this email"
auth/popup-blocked → "Popup was blocked. Trying redirect..."
auth/internal-error → "Google authentication service error..."
```

## Testing the System

### Manual Testing Checklist

1. **Login Flow:**

   ```bash
   ✅ Visit /login
   ✅ Try Google sign-in (popup)
   ✅ Try email/password login
   ✅ Verify redirect to /
   ```

2. **Registration Flow:**

   ```bash
   ✅ Visit /register
   ✅ Create account with email/password
   ✅ Verify automatic sign-in
   ```

3. **Route Protection:**

   ```bash
   ✅ Visit / without auth → redirects to /login
   ✅ Visit /login when authenticated → redirects to /
   ```

4. **Password Reset:**
   ```bash
   ✅ Visit /forgot-password
   ✅ Enter email, verify success message
   ✅ Check email for reset link
   ```

## Production Deployment

### Security Checklist

- ✅ Environment variables set in production
- ✅ Firebase authorized domains configured
- ✅ HTTPS enabled for production domain
- ✅ No sensitive data exposed to client

### Performance

- ✅ Client-side authentication for fast initial load
- ✅ Minimal middleware overhead
- ✅ Firebase SDK tree-shaking enabled

## Troubleshooting

### Common Issues

1. **Missing Environment Variables:**

   ```
   Error: Missing NEXT_PUBLIC_FIREBASE_API_KEY. Fill apps/web/.env.local
   Solution: Add all required Firebase config to .env.local
   ```

2. **Google OAuth Unauthorized Domain:**

   ```
   Error: auth/unauthorized-domain
   Solution: Add your domain to Firebase Console > Authentication > Settings > Authorized domains
   ```

3. **Popup Blocked:**
   ```
   Behavior: Automatically falls back to redirect
   No action needed - system handles this gracefully
   ```

## Future Enhancements

### Server-Side Sessions (Optional)

```typescript
// Can be added later for SSR requirements
import { getServerSession } from '@/lib/session';
```

### Role-Based Access Control

```typescript
// Ready for RBAC integration
export type PublicUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  // roles?: string[]; // Future addition
};
```

## Development Commands

```bash
# Start development
pnpm dev:web

# Build and test
pnpm build
pnpm typecheck
pnpm lint

# Clean restart
pnpm dev:kill
pnpm dev:restart
```

## Support

For issues or questions:

1. Check Firebase Console for configuration
2. Verify .env.local has all required variables
3. Test in incognito mode to rule out cached state
4. Check browser console for detailed error messages
