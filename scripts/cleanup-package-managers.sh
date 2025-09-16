#!/bin/bash

# Clean up mixed package manager artifacts
# This script helps resolve conflicts when npm and pnpm have been used together

set -e

echo "🧹 Cleaning up mixed package manager artifacts..."

# Remove npm artifacts
if [ -f "package-lock.json" ]; then
    echo "📝 Removing package-lock.json (should not exist in pnpm workspace)"
    rm -f package-lock.json
fi

# Remove node_modules that might have been installed by npm
if [ -d "node_modules" ]; then
    echo "📁 Removing root node_modules directory"
    rm -rf node_modules
fi

# Remove nested node_modules in workspace packages
find . -name "node_modules" -type d -not -path "./.git/*" | while read -r dir; do
    echo "📁 Removing nested node_modules: $dir"
    rm -rf "$dir"
done

# Remove any npm cache directories
if [ -d ".npm" ]; then
    echo "🗑️ Removing .npm cache directory"
    rm -rf .npm
fi

# Clear pnpm cache if lock file was corrupted
echo "🔄 Clearing pnpm cache and reinstalling..."
pnpm store prune || true

# Reinstall with pnpm
echo "📦 Reinstalling dependencies with pnpm..."
pnpm install --frozen-lockfile

echo "✅ Cleanup complete! Package manager conflicts resolved."
echo ""
echo "🚀 You can now run:"
echo "  pnpm dev                # Start all services"
echo "  pnpm dev:web           # Start web app only"
echo "  pnpm dev:api           # Start API only"
echo "  pnpm build             # Build all packages"