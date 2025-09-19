# Authentication Debug Guide

**Last Updated**: September 19, 2025  
**Purpose**: Systematic diagnosis of auth/internal-error on final login step

## Current Authentication State

### ✅ Working Components

- **Google Sign-In Popup**: Enhanced with auth/internal-error handling
- **Redirect Fallback**: Automatic fallback when popup fails
- **Server Session API**: `/api/session/me` endpoint functional
- **Debug Infrastructure**: Comprehensive testing tools available

### ❗ Known Issue

**Problem**: `auth/internal-error` occurs on final step before login completion  
**Status**: Redirect successful, but authentication fails at final step  
**Impact**: Users can't complete login despite successful Google redirect

## Debug Tools Available

### 1. Comprehensive Auth Debug Page

**URL**: http://localhost:3000/auth-debug

**Features**:

- **Check Auth State**: Deep Firebase authentication state analysis
- **Test Popup**: Google sign-in popup (will likely fail with auth/internal-error)
- **Test Redirect Result**: Process pending redirect results from Google
- **Sync Server Session**: Test server session synchronization
- **Test Server /api/session/me**: Verify server-side authentication state

### 2. Enhanced Logging

**Location**: Browser console and server logs

**Features**:

- `[google]` prefix for Google authentication operations
- `[login]` prefix for login flow operations
- `[auth-debug]` prefix for debug page operations
- Timestamp tracking for sequence analysis
- Detailed error context and stack traces

## Systematic Diagnosis Process

### Step 1: Initial State Check

```
1. Open http://localhost:3000/auth-debug
2. Click "Check Auth State"
3. Record Firebase authentication state
4. Note any existing user session
```

### Step 2: Test Redirect Flow

```
1. Click "Test Redirect Result"
2. Check for pending redirect results
3. Record any error messages
4. Note user data if present
```

### Step 3: Reproduce the Issue

```
1. Navigate to /login
2. Attempt Google sign-in
3. Complete Google authentication
4. Observe where auth/internal-error occurs
5. Return to debug page
6. Click "Check Auth State" again
```

### Step 4: Server Session Analysis

```
1. Click "Test Server /api/session/me"
2. Compare client vs server authentication state
3. Look for token validation issues
4. Check session synchronization
```

## Expected Findings

Based on user report "successfully redirected but get auth/internal-error on final step":

### ✅ Likely Working

- Google OAuth redirect flow
- User data retrieval from Google
- Initial Firebase authentication token

### ❌ Likely Failing

- Token validation or refresh
- Server session synchronization
- Firebase ID token verification
- Custom claims assignment

## Common auth/internal-error Causes

### 1. Token Validation Issues

```javascript
// Check in debug console
const user = auth.currentUser;
const token = await user.getIdToken(true); // Force refresh
```

### 2. Server-Side Verification Problems

```javascript
// Server session endpoint response
fetch('/api/session/me').then(r => r.json());
```

### 3. Firebase Configuration Mismatches

```javascript
// Verify configuration
console.log({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
});
```

### 4. Custom Claims or Permissions

```javascript
// Check token payload
const token = await user.getIdToken();
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);
```

## Debug Page Functions

### checkAuthState()

**Purpose**: Comprehensive Firebase authentication state analysis  
**Output**: User details, token status, auth state changes  
**Use When**: Initial diagnosis, after failed attempts

### testRedirectResult()

**Purpose**: Process pending redirect results from Google  
**Output**: Redirect result data or null  
**Use When**: After Google redirect, before login completion

### syncServerSession()

**Purpose**: Test server session synchronization  
**Output**: Session sync status and any errors  
**Use When**: Diagnosing client/server session mismatches

### testServerSession()

**Purpose**: Verify server-side authentication state  
**Output**: JWT claims or error status  
**Use When**: Checking what server sees vs client

## Error Pattern Analysis

### Successful Flow Pattern

```
[timestamp] [google] Starting sign-in process
[timestamp] [google] Redirect successful
[timestamp] [login] Processing redirect result
[timestamp] [login] User authenticated: user@example.com
[timestamp] [login] Syncing server session
[timestamp] [login] Server session synced successfully
[timestamp] [login] Redirecting to dashboard
```

### Expected Failure Pattern

```
[timestamp] [google] Starting sign-in process
[timestamp] [google] Redirect successful
[timestamp] [login] Processing redirect result
[timestamp] [login] User authenticated: user@example.com
[timestamp] [login] Syncing server session
[timestamp] [login] ERROR: auth/internal-error
```

## Next Steps After Diagnosis

### If Token Issues

1. Check Firebase project configuration
2. Verify API key permissions
3. Test token refresh mechanism
4. Check token expiration handling

### If Server Session Issues

1. Verify `/api/session/login` endpoint
2. Check Firebase Admin SDK configuration
3. Test JWT verification process
4. Verify session cookie handling

### If Configuration Issues

1. Verify `.env.local` variables
2. Check Firebase console settings
3. Confirm auth domain configuration
4. Test in incognito mode

## Debug Commands

### Clear All Authentication State

```javascript
// In browser console
await firebase.auth().signOut();
localStorage.clear();
sessionStorage.clear();
```

### Force Token Refresh

```javascript
// In browser console
const user = firebase.auth().currentUser;
if (user) {
  const token = await user.getIdToken(true);
  console.log('Fresh token:', token);
}
```

### Check Server Health

```bash
curl -s http://localhost:3333/health | jq .
curl -s http://localhost:3000/api/session/me | jq .
```

## Documentation

For implementation details, see:

- `apps/web/lib/auth-google.ts` - Enhanced Google authentication
- `apps/web/app/(public)/login/page.tsx` - Login flow implementation
- `apps/web/app/api/session/me/route.ts` - Server session probe
- `apps/web/app/(public)/auth-debug/page.tsx` - Debug tools

---

**Goal**: Identify exact source of auth/internal-error on final login step  
**Outcome**: Targeted fix for remaining authentication issue  
**Success Metric**: Complete Google sign-in flow without errors
