#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
pushd apps/web >/dev/null
rm -rf node_modules .next .turbo
pnpm store prune || true
popd >/dev/null
echo "Caches nuked."
