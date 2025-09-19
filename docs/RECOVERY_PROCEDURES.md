# Development Recovery Procedures

**Last Updated**: September 19, 2025  
**Purpose**: Step-by-step procedures for common development issues

## Quick Reference

| Issue Type              | Quick Fix             | Full Procedure                              |
| ----------------------- | --------------------- | ------------------------------------------- |
| Layout crash            | Simplify Providers    | [Layout Recovery](#layout-recovery)         |
| Module loading errors   | Clear cache + restart | [Module Recovery](#module-loading-recovery) |
| Authentication failures | Use debug tools       | [Auth Recovery](#authentication-recovery)   |
| Build failures          | Check TypeScript      | [Build Recovery](#build-recovery)           |
| Port conflicts          | Kill processes        | [Process Recovery](#process-recovery)       |

---

## Layout Recovery

### Symptoms

- "Cannot read properties of undefined (reading 'call')"
- React component render failures
- Layout not displaying

### Quick Fix (2 minutes)

```bash
# 1. Simplify Providers
echo "'use client';
export function Providers({ children }) {
  return <>{children}</>;
}" > apps/web/components/Providers.tsx

# 2. Clear cache and restart
rm -rf apps/web/.next
pnpm dev:kill
pnpm dev:web
```

### Full Recovery Procedure

1. **Identify the failing component**

   ```bash
   # Check error logs
   tail -f logs/web.log
   ```

2. **Create minimal reproduction**

   ```tsx
   // Temporarily replace complex component
   'use client';
   export function ComponentName({ children }) {
     return <>{children}</>;
   }
   ```

3. **Verify imports/exports match**

   ```tsx
   // Layout import
   import { Providers } from '@/components/Providers';

   // Component export (must match exactly)
   export function Providers({ children }) { ... }
   ```

4. **Clear all caches**

   ```bash
   rm -rf apps/web/.next
   rm -rf node_modules/.cache
   ```

5. **Test incrementally**
   - Start with minimal component
   - Add complexity gradually
   - Test after each change

---

## Module Loading Recovery

### Symptoms

- "Module not found" errors
- Import/export mismatches
- Webpack compilation failures

### Quick Fix (1 minute)

```bash
# Clear cache and reinstall
rm -rf apps/web/.next
pnpm install --frozen-lockfile
```

### Full Recovery Procedure

1. **Clear all caches**

   ```bash
   rm -rf apps/web/.next
   rm -rf node_modules
   rm -rf apps/web/node_modules
   ```

2. **Reinstall dependencies**

   ```bash
   pnpm install --frozen-lockfile
   ```

3. **Verify file paths**

   ```bash
   # Check if file exists
   ls -la apps/web/components/Providers.tsx

   # Check import path
   grep -r "Providers" apps/web/app/layout.tsx
   ```

4. **Test build process**
   ```bash
   pnpm build
   pnpm typecheck
   ```

---

## Authentication Recovery

### Symptoms

- `auth/internal-error`
- Login failures
- Session synchronization issues

### Quick Fix (3 minutes)

1. **Open debug page**: http://localhost:3000/auth-debug
2. **Clear auth state**: Click "Clear Results" then "Check Auth State"
3. **Test systematically**: Use each debug button in sequence

### Full Recovery Procedure

1. **Access debug tools**

   ```
   URL: http://localhost:3000/auth-debug
   ```

2. **Systematic diagnosis**

   ```
   1. Click "Check Auth State" - Record Firebase state
   2. Click "Test Redirect Result" - Check pending redirects
   3. Try normal login flow - Note where it fails
   4. Return to debug page
   5. Click "Test Server /api/session/me" - Check server state
   ```

3. **Clear all authentication state**

   ```javascript
   // In browser console
   await firebase.auth().signOut();
   localStorage.clear();
   sessionStorage.clear();
   // Refresh page
   ```

4. **Verify configuration**

   ```bash
   # Check environment variables
   grep -E "FIREBASE|AUTH" apps/web/.env.local
   ```

5. **Test server endpoints**
   ```bash
   curl -s http://localhost:3333/health
   curl -s http://localhost:3000/api/session/me
   ```

---

## Build Recovery

### Symptoms

- TypeScript compilation errors
- ESLint failures
- Build process hanging

### Quick Fix (2 minutes)

```bash
# Clean and rebuild
rm -rf apps/web/.next
pnpm build
```

### Full Recovery Procedure

1. **Check for TypeScript errors**

   ```bash
   pnpm typecheck
   ```

2. **Fix linting issues**

   ```bash
   pnpm lint
   pnpm lint --fix
   ```

3. **Verify package dependencies**

   ```bash
   pnpm install --frozen-lockfile
   ```

4. **Test build process**

   ```bash
   pnpm build
   ```

5. **If still failing, check for circular dependencies**
   ```bash
   # Install madge to detect circular deps
   npx madge --circular apps/web/
   ```

---

## Process Recovery

### Symptoms

- Port already in use (EADDRINUSE)
- Servers not responding
- Multiple processes running

### Quick Fix (30 seconds)

```bash
pnpm dev:kill
```

### Full Recovery Procedure

1. **Kill development processes**

   ```bash
   pnpm dev:kill
   ```

2. **Verify ports are free**

   ```bash
   lsof -ti:3000 -ti:3333
   # Should return nothing
   ```

3. **Check process status**

   ```bash
   pnpm dev:status
   ```

4. **Restart servers**

   ```bash
   # Start API first
   PORT=3333 pnpm dev:api &

   # Wait 5 seconds, then start web
   sleep 5
   pnpm dev:web
   ```

5. **Verify servers are running**
   ```bash
   curl -s http://localhost:3333/health
   curl -s http://localhost:3000
   ```

---

## Emergency Rollback

### When to Use

- Multiple systems failing
- Unknown state after many changes
- Need to return to last known good state

### Procedure

1. **Check git status**

   ```bash
   git status
   git log --oneline -10
   ```

2. **Stash current changes**

   ```bash
   git stash push -m "Emergency stash before rollback"
   ```

3. **Reset to last known good commit**

   ```bash
   # Find last known good commit
   git log --oneline

   # Reset (replace COMMIT_HASH)
   git reset --hard COMMIT_HASH
   ```

4. **Clean all caches**

   ```bash
   rm -rf apps/web/.next
   rm -rf node_modules
   pnpm install --frozen-lockfile
   ```

5. **Restart development environment**
   ```bash
   pnpm dev:kill
   pnpm dev:restart
   ```

---

## Prevention Checklist

### Before Making Changes

- [ ] Commit current working state
- [ ] Note current functionality that works
- [ ] Plan incremental changes
- [ ] Have rollback strategy ready

### During Development

- [ ] Test after each major change
- [ ] Monitor console for errors
- [ ] Keep debug tools open
- [ ] Document what you're changing

### After Changes

- [ ] Test all critical paths
- [ ] Verify build process still works
- [ ] Check authentication flow
- [ ] Commit working state

---

## Emergency Contacts

### Documentation

- [Critical Fixes](./CRITICAL_FIXES.md) - Recent major fixes
- [Current State](./CURRENT_STATE.md) - Project status
- [Auth Debug Guide](./AUTH_DEBUG_GUIDE.md) - Authentication diagnosis

### Key Files for Recovery

- `apps/web/components/Providers.tsx` - Layout provider
- `apps/web/app/layout.tsx` - Root layout
- `apps/web/lib/auth-google.ts` - Authentication logic
- `apps/web/.env.local` - Configuration

### Useful Commands

```bash
# Complete reset
rm -rf apps/web/.next && pnpm dev:kill && pnpm dev:restart

# Debug authentication
open http://localhost:3000/auth-debug

# Check system status
pnpm dev:status && pnpm typecheck && pnpm lint
```
