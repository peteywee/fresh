# Firebase Configuration Engine Documentation

## Overview

The Firebase Configuration Engine is a comprehensive toolkit for automating Firebase authentication setup in your Fresh application. It eliminates the manual complexity of JWT configuration, environment variable management, and authentication flow validation.

## What the Engine Provides

### 🔧 **Automated Configuration**

- **Service Account Validation**: Validates and loads Firebase service account credentials
- **Environment Generation**: Automatically generates `.env.local` with proper escaping
- **Admin SDK Setup**: Configures Firebase Admin SDK with correct private key handling
- **Client SDK Integration**: Validates Firebase client configuration
- **Session Management**: Sets up secure session cookies and authentication flow

### 🔍 **Validation & Health Checks**

- **Comprehensive Validation**: Checks service accounts, environment variables, project consistency
- **Real-time Testing**: Tests Firebase connections and authentication endpoints
- **Issue Detection**: Identifies common configuration problems before they cause runtime errors
- **Auto-fixing**: Automatically resolves common setup issues

### 🛠️ **Development Tools**

- **Interactive Setup**: Guided configuration wizard
- **Diagnostic Tools**: Detailed problem analysis and solution suggestions
- **Health Monitoring**: Continuous validation of Firebase setup
- **Debug Support**: Integration with VS Code debugging workflow

## Available Tools

### 1. **Firebase Config Engine** (`scripts/firebase-config-engine.ts`)

Main configuration automation tool.

```bash
# Full setup with automatic configuration
npx tsx scripts/firebase-config-engine.ts setup

# Diagnose configuration issues
npx tsx scripts/firebase-config-engine.ts diagnose
```

**Features:**

- Loads and validates service account JSON
- Generates environment variables with proper private key escaping
- Tests Firebase Admin SDK connectivity
- Performs comprehensive health checks

### 2. **Firebase Validator** (`scripts/firebase-validator.ts`)

Comprehensive validation and health checking system.

```bash
# Run full validation report
npx tsx scripts/firebase-validator.ts
```

**Validation Checks:**

- ✅ Service account file structure and validity
- ✅ Environment variable completeness
- ✅ Project ID consistency across configurations
- ✅ Firebase Admin SDK connection testing
- ✅ Critical authentication files presence
- ✅ Development server startup capability

### 3. **Firebase Setup Assistant** (`scripts/firebase-setup.ts`)

Interactive setup wizard with guided configuration.

```bash
# Interactive guided setup
npx tsx scripts/firebase-setup.ts

# Quick validation and auto-fixes
npx tsx scripts/firebase-setup.ts --quick

# Full setup with automatic issue fixing
npx tsx scripts/firebase-setup.ts --auto-fix --verbose

# Preview changes without applying
npx tsx scripts/firebase-setup.ts --dry-run
```

**Setup Modes:**

- **Guided**: Full interactive configuration with validation
- **Quick**: Fast validation and minor issue fixes
- **Auto-fix**: Automatic resolution of common problems
- **Dry-run**: Preview mode for testing changes

### 4. **Unified CLI** (`scripts/firebase-config.sh`)

Single entry point for all Firebase configuration tools.

```bash
# Make executable (one time)
chmod +x scripts/firebase-config.sh

# Available commands
./scripts/firebase-config.sh setup       # Full interactive setup
./scripts/firebase-config.sh validate    # Run health checks
./scripts/firebase-config.sh diagnose    # Diagnose issues
./scripts/firebase-config.sh quick       # Quick setup
./scripts/firebase-config.sh doctor      # Complete diagnosis and repair
```

## Setup Workflow

### Prerequisites

1. **Firebase Service Account**: Download from Firebase Console → Project Settings → Service Accounts
   - Save as `secrets/firebase-admin.json`
2. **Firebase Web App Config**: Get from Firebase Console → Project Settings → General → Your apps
   - Add to `apps/web/.env.local` as `NEXT_PUBLIC_FIREBASE_*` variables

### Quick Start

```bash
# 1. Run the configuration engine
./scripts/firebase-config.sh setup

# 2. Start development servers
pnpm dev:web                 # Web server (port 3000)
PORT=3333 pnpm dev:api      # API server (port 3333)

# 3. Test authentication
# Visit: http://localhost:3000/auth-sim
```

### Manual Setup Steps (if needed)

```bash
# 1. Install dependencies
pnpm install

# 2. Run configuration engine
npx tsx scripts/firebase-config-engine.ts setup

# 3. Validate setup
npx tsx scripts/firebase-validator.ts

# 4. Fix any issues
npx tsx scripts/firebase-setup.ts --auto-fix

# 5. Test development environment
pnpm build && pnpm dev:web
```

## Environment Variables Generated

The engine automatically generates these environment variables in `apps/web/.env.local`:

### Client SDK (Public)

```bash
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

### Admin SDK (Server-side)

````bash
```bash
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...
````

### Session Configuration

```bash
SESSION_COOKIE_NAME="__session"
SESSION_COOKIE_DAYS="5"
```

## Common Issues & Solutions

### ❌ "JWT error" / "Decoding Firebase ID token failed"

**Causes:**

- Malformed private key in environment variables
- Project ID mismatch between service account and client config
- Missing private key boundaries

**Solution:**

```bash
./scripts/firebase-config.sh setup
```

### ❌ "Invalid PEM formatted message"

**Cause:** Private key escaping issues in `.env.local`

**Solution:**

```bash
npx tsx scripts/firebase-config-engine.ts setup
```

### ❌ "Service account file not found"

**Cause:** Missing `secrets/firebase-admin.json`

**Solution:**

1. Download from Firebase Console → Project Settings → Service Accounts
2. Generate new private key → Save as `firebase-admin.json`
3. Move to `secrets/firebase-admin.json`

### ❌ "Environment file missing required variables"

**Cause:** Incomplete `.env.local` configuration

**Solution:**

```bash
npx tsx scripts/firebase-setup.ts --auto-fix
```

## Debugging Support

### VS Code Integration

1. **Set breakpoints** in `apps/web/app/api/session/login/route.ts`
2. **Use Debug Terminal**: Run commands in VS Code's "JavaScript Debug Terminal"
3. **Test endpoints**: Use the auth simulator at `http://localhost:3000/auth-sim`

### Auth Simulator Testing

Visit `http://localhost:3000/auth-sim` to test:

- ✅ Google Sign-In flow
- ✅ Email/Password authentication
- ✅ ID token generation
- ✅ Session cookie exchange
- ✅ Session validation

### REST API Testing

```bash
# Test session login endpoint
curl -X POST http://localhost:3000/api/session/login \
  -H "Content-Type: application/json" \
  -d '{"idToken":"your-firebase-id-token"}'

# Test session logout endpoint
curl -X POST http://localhost:3000/api/session/logout
```

## File Structure

```
scripts/
├── firebase-config-engine.ts    # Main configuration automation
├── firebase-validator.ts        # Health checks and validation
├── firebase-setup.ts           # Interactive setup wizard
└── firebase-config.sh          # Unified CLI entry point

apps/web/
├── .env.local                   # Generated environment config
├── lib/
│   ├── firebase.admin.ts        # Admin SDK configuration
│   ├── firebase.client.ts       # Client SDK configuration
│   └── session.ts               # Session management utilities
└── app/api/session/
    ├── login/route.ts           # Session login endpoint
    └── logout/route.ts          # Session logout endpoint

secrets/
└── firebase-admin.json          # Service account credentials
```

## Integration with Existing Workflow

The Firebase Configuration Engine integrates seamlessly with your existing development workflow:

1. **Preserves existing UI**: Your login pages remain unchanged
2. **Works with VS Code tasks**: Compatible with existing development server tasks
3. **Supports CI/CD**: Environment validation works in automated environments
4. **Debug-friendly**: Full VS Code debugging support with breakpoints

## Success Indicators

When setup is complete, you should see:

- ✅ All validation checks pass
- ✅ Development servers start without errors
- ✅ Auth simulator works at `/auth-sim`
- ✅ Session endpoints respond correctly
- ✅ Firebase Admin SDK connects successfully

## Getting Help

If you encounter issues:

1. **Run diagnostics**: `./scripts/firebase-config.sh doctor`
2. **Check validation**: `./scripts/firebase-config.sh validate`
3. **Review logs**: Check development server console output
4. **Test authentication**: Use the auth simulator for end-to-end testing

The Firebase Configuration Engine eliminates the complexity of manual Firebase setup and provides a robust, validated authentication system for your Fresh application.
