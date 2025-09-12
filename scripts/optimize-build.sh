#!/bin/bash
# Build performance optimizer for development

echo "🚀 Optimizing build performance..."

# 1. Clear Next.js cache for fresh build
echo "▶ Clearing Next.js cache..."
rm -rf apps/web/.next
echo "  ✓ Next.js cache cleared"

# 2. Optimize node_modules (optional)
if [ "$1" = "--optimize-deps" ]; then
    echo "▶ Optimizing dependencies..."
    pnpm prune
    echo "  ✓ Dependencies optimized"
fi

# 3. Pre-compile TypeScript types for faster builds
echo "▶ Pre-compiling TypeScript..."
pnpm typecheck --incremental
echo "  ✓ TypeScript pre-compiled"

# 4. Build with detailed timing
echo "▶ Building with performance metrics..."
cd apps/web
NEXT_TELEMETRY_DISABLED=1 time -p pnpm build

echo ""
echo "✅ Build optimization complete!"
echo "💡 Tips for faster builds:"
echo "  - Use 'pnpm dev' with Turbo for fastest development"
echo "  - Run this script with --optimize-deps monthly"
echo "  - Consider using 'pnpm build --experimental-build-mode=compile' for production"
