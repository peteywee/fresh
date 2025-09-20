# 🔥 Autonomous Firebase Setup# Firebase Setup Instructions for Fresh App

**Zero-config Firebase integration for any project structure!**## 1. Firebase Console Setup

## Quick Start (New Project)### Step 1: Enable Google Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)

```bash2. Select your project: `fresh-8990`

# 1. Clone and setup3. Go to **Authentication** → **Sign-in method**

git clone your-repo-url && cd your-project4. Click on **Google** provider

firebase login && firebase init5. Click **Enable**

6. Set support email (your email)

# 2. One-command Firebase setup7. Click **Save**

./scripts/firebase-bootstrap.sh

### Step 2: Configure Authorized Domains

# 3. Start development1. In Firebase Console → **Authentication** → **Settings** → **Authorized domains**

pnpm dev2. Make sure these domains are added:

```  -`localhost` (for development)

- `fresh-8990.firebaseapp.com` (default)

## Quick Start (Existing Project) - Add your production domain when ready

````bash### Step 3: Web App Configuration

# Auto-detect everything and generate configs1. Go to **Project Settings** (gear icon)

pnpm firebase:auto2. Scroll to **Your apps** section

3. Your web app should already be configured with:

# Update with service account (after adding secrets/firebase-admin.json)   - App ID: `1:652857829524:web:39eb695057eaad243d6c81`

pnpm firebase:auto-update

```## 2. Current Configuration Status



## What It Does✅ **Firebase Project**: `fresh-8990`

✅ **Web App Configured**: Yes

✅ **Auto-detects** your project structure (Next.js, React, Node.js, monorepos)  ✅ **Environment Variables**: Set in `/apps/web/.env.local`

✅ **Discovers** Firebase project from `.firebaserc` or `firebase.json`

✅ **Generates** `.env.local` files in correct locations  ## 3. Verification Steps

✅ **Creates** client & server configurations automatically

✅ **Provides** guided service account setup  ### Check if Google Auth is enabled:

✅ **Backs up** existing configurations safely  1. Go to Firebase Console → Authentication → Sign-in method

2. Google should show as "Enabled"

## Available Commands

### Test Firebase connection:

```bash```bash

# Autonomous setup (recommended)# From your project root

pnpm firebase:auto           # Auto-detect and generate all configscurl -s "https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=AIzaSyDI-ayH74k14hCNsLXWIWNAoUhWe9YuM0M"

pnpm firebase:auto-update    # Update with service account data```

pnpm firebase:init           # Interactive setup with prompts

pnpm firebase:bootstrap      # Complete bootstrap from scratch## 4. Common Issues & Solutions



# Legacy tools (still available)### Google Auth Not Working:

pnpm firebase:setup          # Original guided setup- **Check**: Google provider enabled in Firebase Console

pnpm firebase:validate       # Comprehensive health checks- **Check**: Authorized domains include `localhost`

pnpm firebase:doctor         # Complete diagnosis and repair- **Check**: App is running on correct domain (localhost:3001)

````

### Session Failed After Email Login:

## Zero-Config Philosophy- **Issue**: Server-side session management conflict

- **Solution**: Use client-side only authentication (already implemented)

**Before**: Manual .env.local creation, complex project structure navigation, error-prone setup

**After**: Clone repo → Run one command → Start developing### Popup Blocked:

- **Solution**: Already implemented redirect fallback

The autonomous setup eliminates all manual Firebase configuration complexity and works with any project structure out of the box.

## 5. Development Testing

## Documentation

### Test with Demo Account:

- 📚 **[Autonomous Setup Guide](docs/AUTONOMOUS_FIREBASE_SETUP.md)** - Complete zero-config setup- **Email**: `admin@fresh.com`

- 🔧 **[Configuration Engine](docs/FIREBASE_CONFIG_ENGINE.md)** - Advanced setup tools - **Password**: `demo123`

- 🏗️ **[Architecture Overview](.github/copilot-instructions.md)** - Project structure and patterns

### Test Google Auth:

---1. Click "Sign in with Google"

2. Should open Google OAuth popup

*Part of the Fresh framework - Modern PWA-compliant scheduler with TypeScript, Firebase, and Next.js*3. If blocked, automatically redirects to Google 4. After auth, redirects to `/dashboard`

## 6. Next Steps if Issues Persist

1. **Verify Google Auth in Firebase Console**
2. **Check browser console for errors**
3. **Test API endpoints** (if using server-side auth)
4. **Check Firebase project permissions**

## 7. Production Checklist

When deploying to production:

- [ ] Add production domain to Firebase authorized domains
- [ ] Update CORS settings if needed
- [ ] Verify environment variables in production
- [ ] Test OAuth redirect URLs with production domain
