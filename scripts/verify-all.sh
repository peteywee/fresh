#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

printf "\n▶ Installing deps (frozen)\n"
pnpm install --frozen-lockfile

printf "\n▶ Building all packages\n"
pnpm build

printf "\n▶ Typechecking\n"
pnpm typecheck

printf "\n▶ Linting\n"
pnpm lint

printf "\n✅ All checks passed\n"
