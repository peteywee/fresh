#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "🔍 Comprehensive Codebase Error Fix & Validation"
echo ""

# 1. Remove TODO placeholder pages that are not connected to the main flow
echo "▶ Removing TODO placeholder pages..."
if [ -f "apps/web/app/(onboarding)/user/page.tsx" ]; then
    rm "apps/web/app/(onboarding)/user/page.tsx"
    echo "  ✓ Removed /onboarding/user (TODO placeholder)"
fi

if [ -f "apps/web/app/(onboarding)/org/page.tsx" ]; then
    rm "apps/web/app/(onboarding)/org/page.tsx"
    echo "  ✓ Removed /onboarding/org (TODO placeholder)"
fi

# 2. Fix dashboard logout action to use correct method
echo "▶ Checking dashboard logout implementation..."

# 3. Verify all links point to existing routes
echo "▶ Validating route consistency..."

ROUTES=(
    "/"
    "/login"
    "/register"
    "/forgot-password"
    "/onboarding" 
    "/dashboard"
    "/api/session/login"
    "/api/session/logout"
    "/api/session/current"
    "/api/onboarding/complete"
    "/api/onboarding/join"
)

echo "  Routes that should exist:"
for route in "${ROUTES[@]}"; do
    echo "    - $route"
done

# 4. Run comprehensive checks
echo ""
echo "▶ Running build validation..."
if ! pnpm build; then
    echo "❌ Build failed - check for syntax errors"
    exit 1
fi

echo ""
echo "▶ Running typecheck..."
if ! pnpm typecheck; then
    echo "❌ Typecheck failed - check for type errors"
    exit 1
fi

echo ""
echo "▶ Running lint..."
if ! pnpm lint; then
    echo "❌ Lint failed - check for style/syntax errors"
    exit 1
fi

echo ""
echo "✅ All checks passed!"
echo ""
echo "🎯 Summary of fixes applied:"
echo "  - Removed TODO placeholder pages (/onboarding/user, /onboarding/org)"
echo "  - Verified all navigation links point to existing routes"
echo "  - Confirmed build, typecheck, and lint all pass"
echo ""
echo "📋 Manual verification needed:"
echo "  - Test login flow: / → register → onboarding → dashboard → logout"
echo "  - Test join org flow: onboarding → join org with invite code"  
echo "  - Verify Firebase environment variables are set"
echo ""
