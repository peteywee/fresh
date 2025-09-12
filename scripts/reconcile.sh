#!/bin/bash
set -euo pipefail

echo "🔄 Running reconcile script..."

# Kill any processes on port 3001 to prevent conflicts
echo "🧹 Cleaning up port 3001..."
pkill -f ":3001" || true
sleep 1

# Ensure proper ESM imports in packages/types
echo "📦 Checking types package..."
if [ -f "packages/types/src/index.ts" ]; then
    echo "✅ Types package index exists"
else
    echo "❌ Types package index missing"
    exit 1
fi

# Check if onboarding types exist
if [ -f "packages/types/src/onboarding.ts" ]; then
    echo "✅ Onboarding types exist"
else
    echo "⚠️  Creating onboarding types..."
    cat > packages/types/src/onboarding.ts << 'EOF'
import { z } from "zod";

export const OnboardingRequest = z.object({
  user: z.object({
    displayName: z.string().min(1),
  }),
  org: z.object({
    name: z.string().min(2),
  }),
  type: z.enum(["create", "join"]).optional().default("create"),
});

export type OnboardingRequest = z.infer<typeof OnboardingRequest>;

export const OnboardingResponse = z.object({
  ok: z.boolean(),
  org: z.object({
    name: z.string(),
    id: z.string(),
  }),
  user: z.object({
    displayName: z.string(),
    role: z.string(),
  }),
});

export type OnboardingResponse = z.infer<typeof OnboardingResponse>;
EOF
fi

# Ensure onboarding types are exported
echo "🔗 Updating types index exports..."
if ! grep -q "onboarding" packages/types/src/index.ts; then
    echo 'export * from "./onboarding.js";' >> packages/types/src/index.ts
    echo "✅ Added onboarding exports"
fi

# Check API structure
echo "🚀 Checking API structure..."
if [ -f "services/api/src/index.ts" ]; then
    echo "✅ API index exists"
else
    echo "❌ API index missing"
    exit 1
fi

# Build types package first
echo "🔨 Building types package..."
pnpm --filter @packages/types build

# Build API
echo "🔨 Building API..."
pnpm --filter @services/api build

# Build web
echo "🔨 Building web..."
pnpm --filter @apps/web build

echo "✅ Reconcile complete."
