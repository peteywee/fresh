# Firebase Setup for Fresh

This guide covers both manual setup and the new autonomous setup flow. Use autonomous first; fall back to manual if needed.

## Quick Start (Recommended)

- pnpm firebase:auto — Auto-detects project structure and generates client/server configs
- pnpm firebase:auto-update — Updates configs using service account details if available
- pnpm firebase:init — Interactive mode with prompts
- pnpm firebase:bootstrap — Full bootstrap helper (shell script)

See also:
- docs/AUTONOMOUS_FIREBASE_SETUP.md — Zero-config walkthrough
- docs/FIREBASE_CONFIG_ENGINE.md — Advanced diagnostics and tooling

## Manual Console Setup

1) Enable Google Authentication
- Go to Firebase Console → Authentication → Sign-in method
- Click Google → Enable → choose support email → Save

2) Configure Authorized Domains
- Firebase Console → Authentication → Settings → Authorized domains
- Add: localhost, your Firebase default domain, and your production domain when ready

3) Web App Configuration
- Settings (gear) → Your apps → Ensure your Web app exists

## Current Configuration Status

- Firebase Project: fresh-8990
- Web App: configured
- Environment variables: apps/web/.env.local

## Verification

- Google Auth enabled: Firebase Console → Authentication → Sign-in method → Google = Enabled
- API connectivity (optional): curl the public config endpoint if you have a valid API key

## Common Issues & Solutions

- Google Auth not working:
   - Ensure Google provider is enabled
   - Ensure localhost is authorized
   - Confirm you’re using the correct domain/port

- Session failures after login:
   - Verify session cookie name via SESSION_COOKIE_NAME (defaults to __session)
   - Use the diagnostics tool: pnpm firebase:diagnose

- Popup blocked:
   - Use redirect fallback; browser settings may block popups

## Development Testing

- Demo account (if seeded): admin@fresh.com / demo123
- Google sign-in → should reach dashboard after auth

## Production Checklist

- [ ] Add production domain to Firebase authorized domains
- [ ] Update CORS if applicable
- [ ] Verify environment variables in production
- [ ] Test OAuth redirect URLs with production domain

## If Issues Persist

1. Verify Google Auth enabled in the console
2. Check browser console/network tab
3. Test relevant API endpoints
4. Confirm Firebase project permissions and service account configuration
