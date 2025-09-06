#!/usr/bin/env bash
set -euo pipefail

echo "==> Patching Next.js build config..."

# Fix next.config.js for monorepo root tracing
cat > apps/web/next.config.js <<'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingRoot: require('path').join(__dirname, '../../')
  }
};
module.exports = nextConfig;
EOF

# Patch onboarding page to force dynamic rendering
sed -i '1i export const dynamic = "force-dynamic";' apps/web/app/(onboarding)/page.tsx

echo "==> Done. Now re-run: pnpm --filter @apps/web build"
