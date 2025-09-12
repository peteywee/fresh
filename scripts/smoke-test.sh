#!/bin/bash
# Quick smoke test for Fresh project

echo "🧪 Fresh Smoke Test"
echo "=================="

# Test 1: Build succeeds
echo "1. Testing build..."
pnpm build >/dev/null 2>&1 && echo "✅ Build: PASS" || echo "❌ Build: FAIL"

# Test 2: Typecheck succeeds  
echo "2. Testing typecheck..."
pnpm typecheck >/dev/null 2>&1 && echo "✅ Typecheck: PASS" || echo "❌ Typecheck: FAIL"

# Test 3: Lint succeeds
echo "3. Testing lint..."
pnpm lint >/dev/null 2>&1 && echo "✅ Lint: PASS" || echo "⚠️  Lint: WARNINGS"

# Test 4: API health (if running)
echo "4. Testing API health..."
if curl -s http://localhost:3001/health >/dev/null 2>&1; then
    echo "✅ API: RUNNING"
else
    echo "ℹ️  API: NOT RUNNING (start with: pnpm --filter @services/api dev)"
fi

# Test 5: Web health (if running)
echo "5. Testing Web health..."
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ Web: RUNNING"  
else
    echo "ℹ️  Web: NOT RUNNING (start with: pnpm --filter @apps/web dev)"
fi

echo ""
echo "🎯 Smoke test complete!"
echo "To start development:"
echo "  pnpm --filter @services/api dev    # Terminal 1"
echo "  pnpm --filter @apps/web dev        # Terminal 2"
