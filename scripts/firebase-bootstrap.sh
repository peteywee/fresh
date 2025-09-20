#!/bin/bash

# Firebase Bootstrap Script
# Run this after cloning the repo and running 'firebase init'

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo "🔥 Firebase Bootstrap for Fresh"
echo "==============================="
echo ""

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    log_error "Please run this script from the project root directory"
    exit 1
fi

# Check if firebase init has been run
if [[ ! -f "firebase.json" ]] && [[ ! -f ".firebaserc" ]]; then
    log_warning "Firebase not initialized. Please run 'firebase init' first."
    echo ""
    echo "📋 Firebase init checklist:"
    echo "   1. Run: firebase login"
    echo "   2. Run: firebase init"
    echo "   3. Select your Firebase project"
    echo "   4. Configure hosting (optional)"
    echo "   5. Run this script again"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Install dependencies if not present
if [[ ! -d "node_modules" ]]; then
    log_info "Installing dependencies..."
    pnpm install
    log_success "Dependencies installed"
fi

# Install tsx if not present
if ! command -v tsx >/dev/null 2>&1; then
    log_info "Installing tsx for TypeScript execution..."
    pnpm add -w -D tsx
    log_success "tsx installed"
fi

# Run the autonomous setup
log_info "Running autonomous Firebase configuration..."
echo ""

# Check for command line arguments
if [[ $# -gt 0 ]]; then
    npx tsx scripts/firebase-autonomous-setup.ts "$@"
else
    npx tsx scripts/firebase-autonomous-setup.ts --interactive
fi

echo ""
log_success "Bootstrap completed!"
echo ""
echo "📝 Next steps:"
echo "   1. Check the generated .env.local files"
echo "   2. Add your service account JSON to secrets/firebase-admin.json"
echo "   3. Update any [REQUIRED] placeholders in .env.local"
echo "   4. Run: pnpm firebase:auto-update"
echo "   5. Start development: pnpm dev"
echo ""
echo "🆘 Need help?"
echo "   • Run: pnpm firebase:doctor (full diagnosis)"
echo "   • Check: docs/FIREBASE_CONFIG_ENGINE.md"
echo "   • Visit: https://console.firebase.google.com"