#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "🚀 Pre-Push Validation & Quality Gates"
echo ""
echo "This script validates that the codebase is ready for a clean push to GitHub."
echo ""

# Quality gate functions
check_no_todos() {
    echo "▶ Checking for unresolved TODOs/FIXMEs..."
    if grep -r "TODO:\|FIXME:\|XXX:\|HACK:" apps/ packages/ services/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | grep -v node_modules; then
        echo "❌ Found unresolved TODO/FIXME comments"
        return 1
    fi
    echo "  ✓ No unresolved TODO/FIXME comments found"
}

check_no_console_logs() {
    echo "▶ Checking for console.log statements..."
    if grep -r "console\.log" apps/web/app/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "// @debug" | head -3; then
        echo "  ⚠️  Found console.log statements - consider removing for production"
        echo "      (Continuing - these are warnings, not blockers)"
    else
        echo "  ✓ No console.log statements found"
    fi
}

check_env_files_excluded() {
    echo "▶ Checking environment files are not committed..."
    if git ls-files | grep -E "\\.env\\.local|\\.env\\.production" 2>/dev/null; then
        echo "❌ Environment files (.env.local, .env.production) are committed!"
        echo "    These contain secrets and should not be in git."
        return 1
    fi
    echo "  ✓ Environment files properly excluded"
}

check_route_consistency() {
    echo "▶ Validating route consistency..."
    
    # Check that all navigation targets have corresponding pages
    local missing_routes=()
    
    # Expected routes based on app structure
    local expected_routes=(
        "apps/web/app/page.tsx"
        "apps/web/app/(public)/login/page.tsx"
        "apps/web/app/(public)/register/page.tsx"
        "apps/web/app/(public)/forgot-password/page.tsx"
        "apps/web/app/(onboarding)/page.tsx"
        "apps/web/app/dashboard/page.tsx"
    )
    
    for route in "${expected_routes[@]}"; do
        if [[ ! -f "$route" ]]; then
            missing_routes+=("$route")
        fi
    done
    
    if [[ ${#missing_routes[@]} -gt 0 ]]; then
        echo "❌ Missing route files:"
        for route in "${missing_routes[@]}"; do
            echo "    - $route"
        done
        return 1
    fi
    
    echo "  ✓ All expected route files exist"
}

check_firebase_integration() {
    echo "▶ Checking Firebase configuration..."
    
    local config_files=(
        "apps/web/lib/firebase.client.ts"
        "apps/web/lib/firebase.admin.ts" 
        "apps/web/lib/session.ts"
    )
    
    for file in "${config_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            echo "❌ Missing Firebase config: $file"
            return 1
        fi
    done
    
    echo "  ✓ Firebase configuration files exist"
}

# Run all quality gates
main() {
    local failed_checks=0
    
    # Core quality checks
    check_no_todos || ((failed_checks++))
    check_no_console_logs  # Warning only, don't fail
    check_env_files_excluded || ((failed_checks++))
    check_route_consistency || ((failed_checks++))
    check_firebase_integration || ((failed_checks++))
    
    echo ""
    echo "▶ Running build pipeline..."
    
    # Core build pipeline (same as verify-all.sh)
    if ! ./scripts/verify-all.sh; then
        echo "❌ Build pipeline failed"
        ((failed_checks++))
    fi
    
    echo ""
    
    if [[ $failed_checks -eq 0 ]]; then
        echo "✅ All quality gates passed! Codebase is ready for push."
        echo ""
        echo "📋 Final checklist:"
        echo "  ✓ No syntax/type/lint errors"
        echo "  ✓ No unresolved TODOs"
        echo "  ✓ Route structure is complete"
        echo "  ✓ Firebase integration is configured"
        echo "  ✓ Secrets are not committed"
        echo ""
        echo "🚀 Ready to push!"
        echo ""
        echo "Next steps:"
        echo "  git add -A"
        echo "  git commit -m \"feat: complete auth flow with Turbopack, onboarding, and verification\""
        echo "  git push origin main"
        return 0
    else
        echo "❌ $failed_checks quality gate(s) failed."
        echo ""
        echo "🔧 Fix the issues above before pushing."
        return 1
    fi
}

main "$@"
