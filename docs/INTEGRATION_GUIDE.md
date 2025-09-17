# Firebase Authentication Integration Guide

This guide explains how to integrate the authentication system with your existing HTML templates and production setup.

## Master HTML Template Integration

### Option 1: Use Provided Template (Recommended)

The complete master template is available at `docs/templates/auth-master.html`. This template includes:

- ✅ Production-safe CSP headers (Google OAuth compatible)
- ✅ PWA configuration with proper meta tags
- ✅ Error handling for missing Firebase config
- ✅ Loading states and network error fallbacks
- ✅ Complete authentication styling
- ✅ Environment validation scripts

### Option 2: Update Existing Template

If you have an existing HTML template, add these essential elements:

#### 1. CSP Headers (Critical for Google OAuth)

```html
<meta
  http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' 
               https://apis.google.com 
               https://www.gstatic.com 
               https://www.google.com 
               https://securetoken.googleapis.com
               https://www.googleapis.com;
    connect-src 'self' 
                https://identitytoolkit.googleapis.com 
                https://securetoken.googleapis.com
                https://www.googleapis.com
                https://accounts.google.com;
    frame-src 'self' 
              https://accounts.google.com 
              https://www.google.com;
"
/>
```

#### 2. Firebase Meta Tags

```html
<meta name="firebase-auth-domain" content="your-project.firebaseapp.com" />
```

#### 3. Error Fallback Containers

```html
<!-- Add these containers for error handling -->
<div id="auth-error" class="error-screen" style="display: none;">
  <!-- Error content from master template -->
</div>
<div id="network-error" class="error-screen" style="display: none;">
  <!-- Network error content from master template -->
</div>
```

## Environment Setup Guide

### Development Environment

1. **Copy environment template:**

   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```

2. **Fill Firebase configuration:**

   ```env
   # Get these from Firebase Console > Project Settings > General
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
   ```

3. **Start development:**
   ```bash
   pnpm dev:web
   ```

### Production Environment

1. **Secure environment variables:**
   - Never commit `.env.local` to git
   - Use your hosting provider's environment variable system
   - Verify all `NEXT_PUBLIC_FIREBASE_*` variables are set

2. **Firebase project configuration:**

   ```bash
   # Firebase Console checklist:
   ✅ Authentication enabled
   ✅ Email/Password provider enabled
   ✅ Google provider enabled
   ✅ Authorized domains added (your-domain.com)
   ✅ API keys restricted (optional but recommended)
   ```

3. **Deploy checklist:**
   ```bash
   ✅ Environment variables configured
   ✅ HTTPS enabled
   ✅ Firebase authorized domains include production domain
   ✅ CSP headers allow Firebase/Google domains
   ```

## Integration with Existing Systems

### Next.js Integration (Current)

The authentication system is already integrated with Next.js:

```typescript
// Protected page example
import RequireAuth from '@/components/RequireAuth';

export default function ProtectedPage() {
  return (
    <RequireAuth>
      <h1>Protected Content</h1>
    </RequireAuth>
  );
}
```

### API Integration

For API routes that need authentication:

```typescript
// apps/web/app/api/protected/route.ts
import { getAuth } from 'firebase-admin/auth';

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const idToken = authHeader.substring(7);
    const decodedToken = await getAuth().verifyIdToken(idToken);

    // Use decodedToken.uid for user identification
    return Response.json({ message: 'Authenticated', uid: decodedToken.uid });
  } catch (error) {
    return Response.json({ error: 'Invalid token' }, { status: 401 });
  }
}
```

### Client-Side Integration

For client-side JavaScript that needs authentication:

```javascript
// Get current user
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '@/lib/firebase.client';

onAuthStateChanged(auth, user => {
  if (user) {
    console.log('User signed in:', user.uid);
    // Get ID token for API calls
    user.getIdToken().then(token => {
      // Use token in Authorization header
    });
  } else {
    console.log('User signed out');
  }
});
```

## Testing Integration

### Manual Integration Test

1. **Template integration:**

   ```bash
   # Copy master template to your location
   cp docs/templates/auth-master.html your-template-location/

   # Update with your branding/content
   # Test loading states work
   ```

2. **Environment validation:**

   ```bash
   # Missing config test
   mv apps/web/.env.local apps/web/.env.local.backup
   pnpm dev:web
   # Should show "Authentication Setup Required" error

   # Restore config
   mv apps/web/.env.local.backup apps/web/.env.local
   ```

3. **Authentication flow test:**
   ```bash
   # Full flow test
   pnpm dev:web
   # Visit http://localhost:3000
   # Test: login → register → forgot password → logout
   ```

### Automated Testing

```bash
# Run authentication tests
pnpm test

# Check build with authentication
pnpm build
pnpm typecheck
```

## Customization Guide

### Styling Customization

The authentication system uses CSS modules. To customize:

1. **Update auth styles:**

   ```css
   /* apps/web/app/(public)/auth.module.css */
   .container {
     /* Your custom container styles */
   }

   .googleButton {
     /* Your custom Google button styles */
   }
   ```

2. **Update master template styles:**
   ```html
   <!-- In docs/templates/auth-master.html -->
   <style>
     .auth-container {
       /* Your custom background/layout */
     }
   </style>
   ```

### Behavior Customization

1. **Custom redirect logic:**

   ```typescript
   // apps/web/components/RequireAuth.tsx
   // Modify redirect destination
   router.push('/custom-login-page');
   ```

2. **Custom error messages:**
   ```typescript
   // apps/web/lib/auth-email.ts
   // Update error message mapping
   const errorMessages = {
     'auth/user-not-found': 'Your custom message',
     // ...
   };
   ```

## Troubleshooting Integration

### Common Integration Issues

1. **CSP Blocks Google OAuth:**

   ```
   Error: Refused to frame 'https://accounts.google.com'
   Solution: Add Google domains to frame-src in CSP
   ```

2. **Environment Variables Not Found:**

   ```
   Error: Missing NEXT_PUBLIC_FIREBASE_API_KEY
   Solution: Verify .env.local exists and has all required variables
   ```

3. **Unauthorized Domain:**

   ```
   Error: auth/unauthorized-domain
   Solution: Add your domain to Firebase Console > Authentication > Settings
   ```

4. **Template Not Loading:**
   ```
   Issue: Error screens not showing
   Solution: Verify error containers exist in HTML template
   ```

### Debug Mode

Enable detailed logging:

```typescript
// apps/web/lib/firebase.client.ts
// Temporarily add for debugging
import { connectAuthEmulator } from 'firebase/auth';

if (process.env.NODE_ENV === 'development') {
  // Enable debug mode
  console.log('Firebase config:', {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + '...',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  });
}
```

## Production Deployment Checklist

### Pre-Deploy Validation

```bash
# Complete build test
pnpm build
pnpm typecheck
pnpm lint
pnpm test

# Manual auth flow test
pnpm dev:web
# Test all authentication flows work
```

### Post-Deploy Validation

```bash
# Production smoke test
curl -I https://your-domain.com/login
# Should return 200 and proper headers

# Test authentication endpoints
curl https://your-domain.com/api/session/current
# Should handle unauthenticated state gracefully
```

### Monitoring Setup

1. **Firebase Console monitoring:**
   - Authentication > Users (track sign-ups)
   - Authentication > Sign-in methods (monitor providers)

2. **Application monitoring:**
   - Monitor `/login` page load times
   - Track authentication error rates
   - Monitor CSP violation reports

## Support and Maintenance

### Regular Maintenance

1. **Monthly checks:**
   - Firebase quota usage
   - Authentication error rates
   - Security vulnerability updates

2. **Quarterly reviews:**
   - CSP policy effectiveness
   - Authentication flow UX
   - Environment variable rotation

### Getting Help

1. **Documentation:**
   - `docs/AUTHENTICATION.md` - Complete setup guide
   - `docs/templates/auth-master.html` - Master template
   - Firebase Console - Configuration reference

2. **Debugging:**
   - Browser console for client errors
   - Firebase Console for authentication logs
   - Network tab for failed requests

3. **Common fixes:**

   ```bash
   # Reset authentication state
   rm -rf .next
   pnpm build

   # Clear browser cache and cookies
   # Test in incognito mode
   ```
