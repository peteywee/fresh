#!/usr/bin/env bash
set -euo pipefail

echo "==> Fixing imports and build order for API + types..."

# 1. Fix imports in services/api/src/seed.ts
sed -i 's|@packages/types/src/onboarding.js|@packages/types/src/onboarding|' services/api/src/seed.ts

# 2. Ensure types package has build script
jq '.scripts.build = "tsc -p tsconfig.json"' packages/types/package.json > packages/types/package.json.tmp
mv packages/types/package.json.tmp packages/types/package.json

# 3. Ensure API tsconfig uses NodeNext
cat > services/api/tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "strict": true,
    "outDir": "dist",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
EOF

# 4. Root package.json: ensure build chain
jq '.scripts.build = "pnpm --filter @packages/types build && pnpm -r --parallel --if-present build"' package.json > package.json.tmp
mv package.json.tmp package.json

echo "==> Done. Run pnpm install, then pnpm build"