#!/usr/bin/env bash
# scripts/mega-repair.sh
set -euo pipefail

ROOT="$(pwd)"
RUN_SERVERS=0
EDIT_BASHRC=1

for arg in "${@:-}"; do
  case "$arg" in
    --run) RUN_SERVERS=1 ;;
    --no-run) RUN_SERVERS=0 ;;
    --no-bashrc) EDIT_BASHRC=0 ;;
    --help|-h)
      cat <<'USAGE'
Usage: scripts/mega-repair.sh [--run] [--no-bashrc]
  --run         After repairs, auto-start API & Web dev servers
  --no-bashrc   Do not modify ~/.bashrc to set NODE_OPTIONS
USAGE
      exit 0 ;;
  esac
done

say() { printf "\n\033[1;36m==> %s\033[0m\n" "$*"; }
warn() { printf "\033[1;33mWARN:\033[0m %s\n" "$*"; }
ok() { printf "\033[1;32mOK:\033[0m %s\n" "$*"; }

# --- sanity checks -----------------------------------------------------------
say "Sanity checks"
[ -f package.json ] || { echo "Run from repo root (package.json not found)."; exit 1; }
command -v pnpm >/dev/null || { echo "pnpm not found. Install pnpm and retry."; exit 1; }
command -v node >/dev/null || { echo "node not found. Install Node 20+ and retry."; exit 1; }

# --- middleware fix (exclude api/static, robust guards) ----------------------
if [ -d "apps/web" ]; then
  say "Apply middleware fix (apps/web/middleware.ts)"
  mkdir -p apps/web
  cat > apps/web/middleware.ts <<'TS'
import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url);

  // Public or static resources
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    /\.[\w]+$/.test(pathname); // static files

  // NEVER intercept API
  const isAPI = pathname.startsWith("/api");
  if (isPublic || isAPI) return NextResponse.next();

  // Session cookie
  const raw = req.cookies.get("__session")?.value;
  let session: any = null;
  try { session = raw ? JSON.parse(raw) : null; } catch {}

  const loggedIn = !!session?.loggedIn;
  const onboarded = !!session?.onboarded;

  if (!loggedIn && pathname !== "/login")
    return NextResponse.redirect(new URL("/login", req.url));

  if (loggedIn && !onboarded && !pathname.startsWith("/onboarding"))
    return NextResponse.redirect(new URL("/onboarding", req.url));

  if (loggedIn && onboarded && (pathname === "/" || pathname === "/login" || pathname === "/onboarding"))
    return NextResponse.redirect(new URL("/dashboard", req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api|.*\\..*).*)"]
};
TS
  ok "middleware.ts written"
else
  warn "apps/web not found; skipping middleware step"
fi

# --- minimal PWA assets (manifest + SW) --------------------------------------
if [ -d "apps/web" ]; then
  say "Ensure PWA manifest & service worker"
  mkdir -p apps/web/public/icons
  cat > apps/web/public/manifest.webmanifest <<'JSON'
{
  "name": "Fresh",
  "short_name": "Fresh",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#111827",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
JSON

  cat > apps/web/public/sw.js <<'JS'
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open('fresh-v1');
    await cache.addAll(['/','/login','/onboarding','/dashboard','/favicon.ico']);
  })());
});

self.addEventListener('fetch', (event) => {
  event.respondWith((async () => {
    try {
      return await fetch(event.request);
    } catch {
      const cache = await caches.open('fresh-v1');
      const match = await cache.match(event.request, { ignoreSearch: true });
      if (match) return match;
      return caches.match('/');
    }
  })());
});
JS
  ok "PWA files written"

  # Register manifest + SW in layout.tsx (insert if missing)
  if [ -f "apps/web/app/layout.tsx" ]; then
    say "Patch layout.tsx with manifest link & SW registration if missing"
    if ! grep -q 'manifest.webmanifest' apps/web/app/layout.tsx; then
      # Insert <link rel="manifest"> after first <head>
      sed -i '0,/<head>/s//<head>\n        <link rel="manifest" href="\/manifest.webmanifest" \/>/' apps/web/app/layout.tsx || true
    fi
    if ! grep -q 'serviceWorker' apps/web/app/layout.tsx; then
      # Insert SW registration before </body>
      sed -i 's#</body>#<script>if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));}</script>\n      </body>#' apps/web/app/layout.tsx || true
    fi
    ok "layout.tsx patched"
  else
    warn "apps/web/app/layout.tsx not found; skipping layout patch"
  fi
else
  warn "apps/web not found; skipping PWA step"
fi

# --- standardize tsconfig for API + Types (ESNext + Bundler) -----------------
std_tsconfig() {
  local f="$1"
  mkdir -p "$(dirname "$f")"
  cat > "$f" <<'JSON'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules"]
}
JSON
  ok "tsconfig standardized: $f"
}

[ -d "services/api" ] && { say "Standardize services/api/tsconfig.json"; std_tsconfig services/api/tsconfig.json; } || warn "services/api not found"
[ -d "packages/types" ] && { say "Standardize packages/types/tsconfig.json"; std_tsconfig packages/types/tsconfig.json; } || warn "packages/types not found"

# --- ensure @packages/types exports index and re-exports onboarding ----------
if [ -d "packages/types" ]; then
  say "Ensure @packages/types exports and entry"
  cat > packages/types/package.json <<'JSON'
{
  "name": "@packages/types",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": { "zod": "3.23.8" },
  "devDependencies": { "typescript": "5.5.4" }
}
JSON

  mkdir -p packages/types/src
  # Create index.ts if missing; otherwise ensure it re-exports onboarding if present
  if [ ! -f packages/types/src/index.ts ]; then
    cat > packages/types/src/index.ts <<'TS'
// Root export barrel
export * from "./onboarding";
TS
    ok "created packages/types/src/index.ts"
  else
    if [ -f packages/types/src/onboarding.ts ] && ! grep -q 'export \* from "./onboarding"' packages/types/src/index.ts; then
      echo 'export * from "./onboarding";' >> packages/types/src/index.ts
      ok "appended export * from './onboarding' to index.ts"
    fi
  fi
else
  warn "packages/types not found; skipping export setup"
fi

# --- doctor script to find missing pages/routes and show endpoints ----------
say "Add scripts/doctor.sh"
mkdir -p scripts
cat > scripts/doctor.sh <<'BASH'
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
BASH
chmod +x scripts/doctor.sh
ok "doctor.sh written"

# --- optional: Increase node memory to reduce VSCode terminal kills ----------
if [ $EDIT_BASHRC -eq 1 ]; then
  say "Ensure Node memory headroom in ~/.bashrc (ChromeOS/Crostini friendly)"
  if ! grep -q 'NODE_OPTIONS=.*max-old-space-size' "${HOME}/.bashrc" 2>/dev/null; then
    echo 'export NODE_OPTIONS="--max-old-space-size=2048"' >> "${HOME}/.bashrc"
    ok "Appended NODE_OPTIONS to ~/.bashrc (open new terminal or: source ~/.bashrc)"
  else
    ok "NODE_OPTIONS already present in ~/.bashrc"
  fi
else
  warn "Skipped ~/.bashrc edit (--no-bashrc provided)"
fi

# --- install & build types first (helps editors) -----------------------------
say "pnpm install (workspace)"
pnpm install

say "Approve native builds if prompted (pnpm v10+)"
pnpm approve-builds || true

if [ -d "packages/types" ]; then
  say "Build @packages/types first"
  pnpm --filter @packages/types build
fi

# --- clear port conflicts for API -------------------------------------------
say "Clear port 3001 if busy"
lsof -i :3001 -sTCP:LISTEN -t | xargs -r kill -9 || true
ok "Port 3001 clear (or already free)"

# --- run doctor --------------------------------------------------------------
say "Run doctor"
./scripts/doctor.sh || true

# --- optionally run dev servers ---------------------------------------------
if [ $RUN_SERVERS -eq 1 ]; then
  say "Starting API (services/api) and Web (apps/web) in two terminals..."
  # Try VS Code tasks if present; otherwise direct commands
  if [ -f ".vscode/tasks.json" ]; then
    warn "If using VS Code, run tasks: 'dev:api' and 'dev:web'"
  fi
  # Start API in background, Web in foreground
  (pnpm --filter @services/api dev &>/dev/null &) || true
  sleep 1
  pnpm --filter @apps/web dev
else
  say "Done. Next steps (recommended):"
  cat <<'NEXT'
1) In Terminal A:
   pnpm --filter @services/api dev
2) In Terminal B:
   pnpm --filter @apps/web dev
3) Verify:
   curl -i http://localhost:3001/health
   open http://localhost:3000/
4) If something still looks off:
   ./scripts/doctor.sh
NEXT
fi

ok "Mega repair completed"
