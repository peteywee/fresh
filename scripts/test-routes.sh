#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "🧪 Route Flow Testing Guide"
echo ""
echo "This guide helps you manually validate all navigation flows work correctly."
echo "Run this after starting the dev server: pnpm dev:web"
echo ""

cat << 'EOF'
🔗 Route Flow Testing Checklist

Prerequisites:
- Dev server running: pnpm dev:web
- Open http://localhost:3000 in browser
- Have development tools open (F12)

Flow 1: New User Registration → Onboarding → Dashboard
  1. Navigate to: http://localhost:3000
     ✓ Should show login form (homepage is now login)
  
  2. Click "Sign Up" link
     ✓ Should navigate to /register
  
  3. Fill registration form and submit
     ✓ Should redirect to /onboarding after successful registration
  
  4. Choose "Create Organization" option
     ✓ Should show organization creation form
  
  5. Fill display name and organization name, submit
     ✓ Should redirect to /dashboard
     ✓ Should show user profile and organization cards
     ✓ Should show invitation code for owners

Flow 2: Existing User Login → Dashboard
  1. Navigate to: http://localhost:3000
  
  2. Enter existing user credentials and click "Login"
     ✓ Should redirect to /dashboard (if onboarding complete)
     ✓ Should redirect to /onboarding (if onboarding not complete)

Flow 3: Forgot Password
  1. Navigate to: http://localhost:3000
  
  2. Click "Forgot Password" link
     ✓ Should navigate to /forgot-password
  
  3. Enter email and submit
     ✓ Should show success message
  
  4. Click "Back to Login"
     ✓ Should navigate to / (homepage login)

Flow 4: Join Organization via Invite Code
  1. Register a new account (follow Flow 1 steps 1-3)
  
  2. On onboarding page, choose "Join Organization"
     ✓ Should show invite code entry form
  
  3. Enter an invite code like "FRESH-TESTORG-123456"
     ✓ Should redirect to /dashboard after submission
     ✓ Should show role as "Member" (not "Owner")

Flow 5: Navigation Links & Middleware
  1. When logged out, try accessing: http://localhost:3000/dashboard
     ✓ Should redirect to / (homepage login)
  
  2. When logged in but onboarding not complete, try: http://localhost:3000/dashboard
     ✓ Should redirect to /onboarding
  
  3. When logged in with complete onboarding, try: http://localhost:3000/
     ✓ Should allow access to homepage
     ✓ Should show login form but redirect if already authenticated

Flow 6: Logout
  1. From dashboard, click "Sign Out" button
     ✓ Should show confirmation dialog
  
  2. Confirm sign out
     ✓ Should redirect to /login
     ✓ Session should be cleared

Flow 7: Copy Invitation Code (Clipboard Test)
  1. Login as organization owner
  2. On dashboard, find invitation code section
  3. Click "Copy Code" button
     ✓ Should copy code to clipboard
     ✓ Should show "Copied!" feedback
     ✓ Should work even if Clipboard API is blocked

❌ Common Issues to Look For:
  - Console errors in browser dev tools
  - Infinite redirect loops
  - 404 errors on navigation
  - Firebase authentication errors
  - Session not persisting across page refreshes
  - Middleware blocking legitimate routes

🔧 Environment Setup Required:
  - Firebase project configured
  - Service account key in .env.local
  - Firebase Authentication enabled
  - All NEXT_PUBLIC_FIREBASE_* variables set

EOF

echo ""
echo "📊 Quick Health Check Commands:"
echo ""
echo "  # Check if server is responsive"
echo "  curl -s http://localhost:3000 | grep -q 'Login' && echo '✓ Homepage loads'"
echo ""
echo "  # Check API routes"
echo "  curl -s http://localhost:3000/api/session/current | jq . || echo 'API route working'"
echo ""
echo "  # Check Firebase config loaded"
echo "  node -e \"console.log(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✓ Firebase config' : '❌ Missing Firebase config')\""
echo ""
echo "Happy testing! 🚀"
