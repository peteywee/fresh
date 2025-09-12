#!/usr/bin/env bash
set -euo pipefail

has_rg=0
if command -v rg >/dev/null; then has_rg=1; fi

echo "==> Next pages referenced but missing"
if [ $has_rg -eq 1 ]; then
  targets=$(rg -n --no-heading -o '(redirect\(\s*["'\''"](/[^"'\''\)]+)|href=["'\''"](/[^"'\'']+)' apps/web/app 2>/dev/null \
    | sed -E 's/.*(["'\''])(\/[^"'\'']+).*/\2/' | sort -u)
else
  targets=$(grep -RnoE '(redirect\(|href=)' apps/web/app 2>/dev/null | sed -n 's/.*href=["'\'']\([^"'\'' ]*\).*/\1/p' | sort -u)
fi

for t in $targets; do
  [ "$t" = "/" ] && continue
  if [ -d "apps/web/app${t}" ] || [ -f "apps/web/app${t}/page.tsx" ] || [ -f "apps/web/app${t}/page.jsx" ]; then
    echo "OK page exists: $t"
  else
    echo "MISSING page: $t"
  fi
done

echo "==> Frontend calls to /api/* have route handlers?"
if [ $has_rg -eq 1 ]; then
  apis=$(rg -n --no-heading -o 'fetch\(\s*["'\''](/api/[^"'\'']+)' apps/web/app 2>/dev/null \
    | sed -E 's/.*(["'\''])(\/api\/[^"'\'']+).*/\2/' | sort -u)
else
  apis=$(grep -RnoE 'fetch\(' apps/web/app 2>/dev/null | sed -n 's/.*fetch(["'\'']\([^"'\'' ]*\).*/\1/p' | grep '^/api/' | sort -u)
fi

for a in $apis; do
  p="apps/web/app${a}/route.ts"
  if [ -f "$p" ] || [ -f "${p/\.ts/.js}" ]; then
    echo "OK api route exists: $a"
  else
    echo "MISSING api route: $a (expected apps/web/app${a}/route.ts)"
  fi
done

echo "==> Express endpoints detected"
if [ -d "services/api/src" ]; then
  if [ $has_rg -eq 1 ]; then
    rg -n "app\.(get|post|put|patch|delete)\(\s*['\"][^'\"]+" services/api/src 2>/dev/null \
      | sed -E 's/.*app\.(get|post|put|patch|delete)\(\s*([^\)]+)\).*/\1 \2/'
  else
    grep -RnoE "app\.(get|post|put|patch|delete)\(" services/api/src 2>/dev/null
  fi
else
  echo "(services/api/src not found)"
fi

echo "==> Port 3001 listeners"
lsof -i :3001 -sTCP:LISTEN || echo "OK: 3001 free"

echo "==> Typecheck (workspace)"
pnpm -s -r --if-present typecheck || true

echo "==> Lint (workspace)"
pnpm -s -r --if-present lint || true

echo "==> Doctor done"
