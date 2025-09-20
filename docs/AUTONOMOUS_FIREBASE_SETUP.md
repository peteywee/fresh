# Autonomous Firebase Setup - Zero-Config Firebase Integration

## Overview

The Autonomous Firebase Setup is a zero-configuration tool that automatically detects your project structure and generates all necessary Firebase configuration files. No pre-existing setup required - just clone a repo and run one command!

## Quick Start

### For New Projects (After Cloning)

```bash
# 1. Clone your repo
git clone your-repo-url
cd your-project

# 2. Initialize Firebase (if not done)
firebase login
firebase init

# 3. Run autonomous setup
./scripts/firebase-bootstrap.sh

# 4. Start development
pnpm dev
```

### For Existing Projects

```bash
# Auto-detect everything
pnpm firebase:auto

# Specify project manually
pnpm firebase:auto --project-id your-firebase-project

# Interactive mode (prompts for missing info)
pnpm firebase:init

# Update with service account (after adding secrets/firebase-admin.json)
pnpm firebase:auto-update
```

## What It Does Automatically

### 🔍 **Project Structure Detection**

- ✅ **Web Apps**: Next.js, React, Vue, Angular (apps/, packages/, web/, frontend/, client/, src/)
- ✅ **API Services**: Express, Fastify, Node.js (services/, api/, backend/, server/, functions/)
- ✅ **Monorepos**: Automatically handles complex project structures
- ✅ **Framework Detection**: Identifies Next.js, React, and Node.js patterns

### 🔥 **Firebase Project Detection**

- ✅ **Auto-Discovery**: Reads `.firebaserc` and `firebase.json`
- ✅ **CLI Integration**: Uses Firebase CLI if available
- ✅ **Manual Override**: Accepts `--project-id` flag
- ✅ **Interactive Mode**: Prompts for missing information

### 📝 **Configuration Generation**

- ✅ **Client Config**: `NEXT_PUBLIC_FIREBASE_*` variables for web apps
- ✅ **Server Config**: `FIREBASE_*` variables for Admin SDK
- ✅ **Session Config**: Session cookie and authentication settings
- ✅ **Location Aware**: Creates `.env.local` files in correct directories

### 🔒 **Security & Best Practices**

- ✅ **Backup Creation**: Backs up existing `.env.local` files
- ✅ **Service Account Instructions**: Generates setup guides
- ✅ **Environment Separation**: Client vs server configuration isolation
- ✅ **Gitignore Safe**: Follows security best practices

## Commands Reference

### Package.json Scripts

```bash
# Autonomous setup commands
pnpm firebase:auto           # Auto-detect and generate configs
pnpm firebase:auto-update    # Update with service account data
pnpm firebase:init           # Interactive setup with prompts

# Legacy setup commands (still available)
pnpm firebase:setup          # Original guided setup
pnpm firebase:validate       # Health checks and validation
pnpm firebase:doctor         # Complete diagnosis and repair
```

### Direct TypeScript Execution

```bash
# Basic autonomous setup
npx tsx scripts/firebase-autonomous-setup.ts

# With specific project ID
npx tsx scripts/firebase-autonomous-setup.ts --project-id my-project

# Interactive mode
npx tsx scripts/firebase-autonomous-setup.ts --interactive

# Update existing configs
npx tsx scripts/firebase-autonomous-setup.ts --update
```

### Bootstrap Script

```bash
# Complete setup from scratch
./scripts/firebase-bootstrap.sh

# With project ID
./scripts/firebase-bootstrap.sh --project-id my-project
```

## Generated File Structure

After running autonomous setup:

```
your-project/
├── apps/web/.env.local              # Client + Server + Session config
├── services/api/.env.local          # Server config only
├── functions/.env.local             # Server config only (if exists)
├── .env.local                       # Full config (fallback)
└── secrets/
    ├── README-SETUP.md              # Service account instructions
    └── firebase-admin.json          # (You add this manually)
```

## Example Generated .env.local

### Web App (apps/web/.env.local)

```bash
# Firebase Client SDK Configuration (Public)
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"

# Firebase Admin SDK Configuration (Server-side)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Session Configuration
SESSION_COOKIE_NAME="__session"
SESSION_COOKIE_DAYS="5"
```

### API Service (services/api/.env.local)

```bash
# Firebase Admin SDK Configuration (Server-side)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Workflow for New Team Members

1. **Clone Repository**

   ```bash
   git clone your-repo-url
   cd your-project
   ```

2. **Firebase Setup** (if not done)

   ```bash
   firebase login
   firebase init  # Select existing project
   ```

3. **Autonomous Configuration**

   ```bash
   ./scripts/firebase-bootstrap.sh
   ```

4. **Add Service Account** (one-time)
   - Download from Firebase Console → Project Settings → Service Accounts
   - Save as `secrets/firebase-admin.json`

5. **Update Configuration**

   ```bash
   pnpm firebase:auto-update
   ```

6. **Start Development**
   ```bash
   pnpm dev
   ```

## Comparison: Autonomous vs Manual Setup

| Feature                 | Manual Setup    | Autonomous Setup    |
| ----------------------- | --------------- | ------------------- |
| **Time Required**       | 15-30 minutes   | 2-3 minutes         |
| **Configuration Files** | Manual creation | Auto-generated      |
| **Project Detection**   | Manual paths    | Auto-detection      |
| **Error Prone**         | High            | Low                 |
| **Team Onboarding**     | Complex         | Simple              |
| **Firebase Project**    | Manual entry    | Auto-discovery      |
| **Service Account**     | Manual setup    | Guided instructions |
| **Validation**          | Manual testing  | Built-in checks     |

## Supported Project Structures

### ✅ Monorepos

```
project/
├── apps/
│   ├── web/          # Next.js/React app
│   └── mobile/       # React Native (ignored)
├── services/
│   └── api/          # Express/Node.js API
└── packages/
    └── shared/       # Shared libraries
```

### ✅ Simple Projects

```
project/
├── src/              # React/Next.js app
├── server/           # Express API
└── functions/        # Firebase Functions
```

### ✅ Next.js Projects

```
project/
├── app/              # Next.js App Router
├── pages/            # Next.js Pages Router
├── lib/              # Utilities
└── api/              # API routes
```

## Advanced Usage

### Custom Project Structure

If your project uses non-standard paths, the autonomous setup will still work but may create configs in unexpected locations. You can:

1. **Run with detection**: Let it auto-detect and move files manually
2. **Use manual setup**: Fall back to `pnpm firebase:setup` for custom paths
3. **Extend the script**: Modify `firebase-autonomous-setup.ts` for your structure

### Environment Variables Priority

The autonomous setup looks for Firebase project ID in this order:

1. `--project-id` command line flag
2. `.firebaserc` file (most reliable)
3. `firebase.json` file
4. Firebase CLI current project
5. Interactive prompt (if `--interactive`)

### Service Account Handling

- **Initial Setup**: Creates placeholder values with instructions
- **Update Phase**: Replaces placeholders with actual service account data
- **Security**: Never commits sensitive data to git
- **Validation**: Checks format and completeness

## Troubleshooting

### Common Issues

**❌ "Firebase project not detected"**

```bash
# Solution: Specify manually
npx tsx scripts/firebase-autonomous-setup.ts --project-id your-project
```

**❌ "No web apps or API services found"**

```bash
# Solution: Creates config in root directory
# Move .env.local to correct location manually
```

**❌ "[REQUIRED] placeholders in .env.local"**

```bash
# Solution: Get values from Firebase Console
# Then run: pnpm firebase:auto-update
```

### Getting Help

```bash
# Run diagnostics
pnpm firebase:doctor

# Validate configuration
pnpm firebase:validate

# View help
npx tsx scripts/firebase-autonomous-setup.ts --help
```

## Migration from Manual Setup

If you have existing manual Firebase configuration:

1. **Backup existing files**

   ```bash
   cp apps/web/.env.local apps/web/.env.local.manual-backup
   ```

2. **Run autonomous setup**

   ```bash
   pnpm firebase:auto --project-id your-project
   ```

3. **Compare and merge**
   - Autonomous setup creates backups automatically
   - Compare generated config with your manual setup
   - Copy any custom variables you need

4. **Validate**
   ```bash
   pnpm firebase:validate
   ```

The Autonomous Firebase Setup eliminates the complexity of manual configuration and provides a consistent, reliable way to set up Firebase authentication in any project structure!
