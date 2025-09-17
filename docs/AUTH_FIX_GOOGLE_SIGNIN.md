# Google Sign-In Stability (Popup + Redirect Fallback)

## Why popups fail

Chrome/ChromeOS and browser extensions often block `signInWithPopup()`. This produced no visible UI and looked like “button doesn’t click”.

## Fix implemented

- `signInWithGoogle()` tries popup first, then automatically falls back to `signInWithRedirect()` on popup-blocked/canceled.
- `consumeRedirectResult()` runs on page mount to complete sign-in after redirect.
- Login/Register use these helpers.

## Firebase Console requirements

- Authentication → Sign-in method → Enable Google.
- Authentication → Settings → Authorized domains:
  - `localhost` (dev)
  - `<your-project>.web.app`, `<your-project>.firebaseapp.com` (if you use Firebase Hosting)
  - Any custom domain you serve from
- OAuth consent screen must be configured with your app name, logo (optional), and test users (if in testing).

## Next.js middleware

- Keep `/login`, `/register`, `/forgot-password`, `/reset-password` public.
- Do not block `/api/*` or static assets.

## Env vars

Fill `apps/web/.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=optional
SESSION_COOKIE_NAME=__session
SESSION_COOKIE_DAYS=5
NEXT_PUBLIC_APP_NAME=Fresh
```

Restart `next dev` after changes.
