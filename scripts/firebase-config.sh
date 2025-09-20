#!/bin/bash

# Firebase Configuration Engine - Main Entry Point
# Provides unified access to all Firebase configuration tools

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
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

# Check if tsx is available
check_tsx() {
    if ! command -v tsx >/dev/null 2>&1; then
        log_error "tsx not found. Installing..."
        cd "$ROOT_DIR"
        pnpm add -w -D tsx
        log_success "tsx installed"
    fi
}

# Display help information
show_help() {
    cat << EOF
🔥 Firebase Configuration Engine

A comprehensive toolkit for setting up and managing Firebase authentication 
in your Fresh application.

COMMANDS:
  setup       Full interactive Firebase configuration setup
  validate    Comprehensive health check and validation
  diagnose    Diagnose configuration issues and suggest fixes
  quick       Quick setup for existing configurations
  doctor      Complete environment diagnosis and repair

SETUP OPTIONS:
  --auto-fix        Automatically fix common issues
  --verbose         Show detailed output and validation
  --dry-run         Preview changes without applying them
  --skip-validation Skip initial health checks

EXAMPLES:
  $0 setup                    # Interactive guided setup
  $0 setup --auto-fix         # Setup with automatic issue fixing
  $0 validate                 # Run comprehensive health checks
  $0 diagnose                 # Diagnose and suggest fixes
  $0 quick                    # Quick validation and minor fixes
  $0 doctor                   # Full diagnosis and repair

WHAT THIS TOOLKIT PROVIDES:
  ✅ Service account validation and configuration
  ✅ Environment variable generation and validation
  ✅ Firebase Admin SDK setup and testing
  ✅ Client SDK configuration verification
  ✅ Authentication flow validation
  ✅ Development server compatibility checks
  ✅ Automatic issue detection and fixing

PREREQUISITES:
  📁 secrets/firebase-admin.json    (from Firebase Console)
  📁 apps/web/.env.local            (with NEXT_PUBLIC_FIREBASE_* vars)

NEXT STEPS AFTER SETUP:
  🚀 Start development: pnpm dev:web
  🧪 Test auth flow: http://localhost:3000/auth-sim
  🐛 Debug with VS Code breakpoints in session routes

For more information, see docs/ or .github/copilot-instructions.md
EOF
}

# Main command dispatcher
main() {
    local command="${1:-help}"
    shift || true
    
    cd "$ROOT_DIR"
    
    case "$command" in
        setup)
            log_info "Starting Firebase configuration setup..."
            check_tsx
            npx tsx scripts/firebase-setup.ts "$@"
            ;;
        
        validate)
            log_info "Running Firebase validation..."
            check_tsx
            npx tsx scripts/firebase-validator.ts "$@"
            ;;
        
        diagnose)
            log_info "Running Firebase diagnosis..."
            check_tsx
            npx tsx scripts/firebase-config-engine.ts diagnose "$@"
            ;;
        
        quick)
            log_info "Running quick Firebase setup..."
            check_tsx
            npx tsx scripts/firebase-setup.ts --quick "$@"
            ;;
        
        doctor)
            log_info "Running complete Firebase doctor..."
            check_tsx
            echo "🏥 Firebase Doctor - Complete Diagnosis and Repair"
            echo "=================================================="
            echo ""
            echo "1️⃣ Running validation..."
            npx tsx scripts/firebase-validator.ts --verbose
            echo ""
            echo "2️⃣ Running diagnosis..."
            npx tsx scripts/firebase-config-engine.ts diagnose
            echo ""
            echo "3️⃣ Attempting auto-repair..."
            npx tsx scripts/firebase-setup.ts --auto-fix --verbose
            ;;
        
        help|--help|-h)
            show_help
            ;;
        
        *)
            log_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Error handling
trap 'log_error "Script failed on line $LINENO"' ERR

# Check if running in correct directory
if [[ ! -f "package.json" ]] || [[ ! -d "apps/web" ]]; then
    log_error "This script must be run from the root of the Fresh project"
    exit 1
fi

# Execute main function
main "$@"