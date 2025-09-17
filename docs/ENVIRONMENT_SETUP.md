# Fresh Authentication - Environment Setup

## Required Environment Variables

Copy this template to `apps/web/.env.local` and fill in your Firebase project values:

```env
# Firebase Configuration (Required)
# Get these from Firebase Console > Project Settings > General > Your apps

# Your web app's Firebase configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456789012345

# Optional: Firebase Analytics
# NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Getting Firebase Configuration Values

### Step 1: Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (or create new)
3. Click Settings gear ⚙️ > Project settings
4. Scroll to "Your apps" section
5. Click on your web app or "Add app" if none exists

### Step 2: Copy Configuration

```javascript
// You'll see something like this in Firebase Console:
const firebaseConfig = {
  apiKey: 'AIzaSyC...',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef123456',
};
```

### Step 3: Convert to Environment Variables

```env
# Map Firebase config to environment variables:
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

## Firebase Project Setup

### Enable Authentication

1. Firebase Console > Authentication
2. Click "Get started"
3. Sign-in method tab
4. Enable **Email/Password**
5. Enable **Google**
6. Save

### Configure Authorized Domains

1. Authentication > Settings > Authorized domains
2. Add your domains:
   ```
   localhost (for development)
   your-production-domain.com
   your-preview-domain.vercel.app (if using Vercel)
   your-codespace-domain.github.dev (if using Codespaces)
   ```

## Environment Validation

The system automatically validates your configuration. If you see errors:

### Missing Configuration Error

```
Error: Missing NEXT_PUBLIC_FIREBASE_API_KEY. Fill apps/web/.env.local
```

**Solution:** Create `.env.local` file with all required variables

### Invalid Configuration Error

```
Error: Firebase app initialization failed
```

**Solution:** Verify all environment variables are correct

### Unauthorized Domain Error

```
Error: auth/unauthorized-domain
```

**Solution:** Add your domain to Firebase authorized domains

## Development vs Production

### Development (.env.local)

```env
# Local development - full access
NEXT_PUBLIC_FIREBASE_API_KEY=your_dev_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-dev-project.firebaseapp.com
# ... other dev values
```

### Production (Hosting Platform)

```env
# Production - same variables, production Firebase project
NEXT_PUBLIC_FIREBASE_API_KEY=your_prod_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-prod-project.firebaseapp.com
# ... other prod values
```

## Security Notes

### What's Safe to Expose

- ✅ All `NEXT_PUBLIC_FIREBASE_*` variables are safe to expose to browsers
- ✅ Firebase API keys are designed to be public
- ✅ Configuration is validated on Firebase servers

### What to Keep Private

- ❌ Never commit `.env.local` to git (already in .gitignore)
- ❌ Don't share Firebase private keys (not used in this setup)
- ❌ Don't expose database connection strings (not applicable here)

## Testing Your Setup

### Quick Test

```bash
# Start development server
pnpm dev:web

# Visit http://localhost:3000
# Should redirect to /login
# Should see Google sign-in button (no errors)
```

### Detailed Test

```bash
# Open browser console
# Visit http://localhost:3000/login
# Should see no Firebase errors
# Google button should open popup
# Email form should accept input
```

## Troubleshooting

### Environment Not Loading

```bash
# Check file exists
ls -la apps/web/.env.local

# Check content format
cat apps/web/.env.local | head -5
```

### Variables Not Available

```bash
# Restart development server
pnpm dev:kill
pnpm dev:web

# Clear Next.js cache
rm -rf .next
pnpm dev:web
```

### Firebase Console Issues

1. **Project not found:** Verify project ID matches exactly
2. **API key issues:** Generate new API key in Firebase Console
3. **Domain issues:** Double-check authorized domains list

## Example Working Configuration

```env
# Example .env.local (with fake values for reference)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=fresh-scheduler-demo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=fresh-scheduler-demo
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=fresh-scheduler-demo.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890123456
```

**Note:** Replace all values with your actual Firebase project configuration.
