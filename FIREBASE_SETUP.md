# Firebase Setup Instructions for Fresh App

## 1. Firebase Console Setup

### Step 1: Enable Google Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `fresh-8990`
3. Go to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Click **Enable**
6. Set support email (your email)
7. Click **Save**

### Step 2: Configure Authorized Domains
1. In Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Make sure these domains are added:
   - `localhost` (for development)
   - `fresh-8990.firebaseapp.com` (default)
   - Add your production domain when ready

### Step 3: Web App Configuration
1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps** section
3. Your web app should already be configured with:
   - App ID: `1:652857829524:web:39eb695057eaad243d6c81`

## 2. Current Configuration Status

✅ **Firebase Project**: `fresh-8990`
✅ **Web App Configured**: Yes
✅ **Environment Variables**: Set in `/apps/web/.env.local`

## 3. Verification Steps

### Check if Google Auth is enabled:
1. Go to Firebase Console → Authentication → Sign-in method
2. Google should show as "Enabled"

### Test Firebase connection:
```bash
# From your project root
curl -s "https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=AIzaSyDI-ayH74k14hCNsLXWIWNAoUhWe9YuM0M"
```

## 4. Common Issues & Solutions

### Google Auth Not Working:
- **Check**: Google provider enabled in Firebase Console
- **Check**: Authorized domains include `localhost`
- **Check**: App is running on correct domain (localhost:3001)

### Session Failed After Email Login:
- **Issue**: Server-side session management conflict
- **Solution**: Use client-side only authentication (already implemented)

### Popup Blocked:
- **Solution**: Already implemented redirect fallback

## 5. Development Testing

### Test with Demo Account:
- **Email**: `admin@fresh.com`
- **Password**: `demo123`

### Test Google Auth:
1. Click "Sign in with Google"
2. Should open Google OAuth popup
3. If blocked, automatically redirects to Google
4. After auth, redirects to `/dashboard`

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