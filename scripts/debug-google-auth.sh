#!/bin/bash

# Google OAuth Debug Script
# This script helps debug Google authentication issues

echo "🔍 Google OAuth Configuration Debug"
echo "===================================="
echo ""

# Check environment variables
echo "📋 Environment Variables:"
cd /workspaces/fresh/apps/web

# Load environment variables
if [ -f .env.local ]; then
    source .env.local
fi

echo "   NEXT_PUBLIC_FIREBASE_API_KEY: ${NEXT_PUBLIC_FIREBASE_API_KEY:0:20}..."
echo "   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: $NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
echo "   NEXT_PUBLIC_FIREBASE_PROJECT_ID: $NEXT_PUBLIC_FIREBASE_PROJECT_ID"
echo ""

# Check if Firebase project exists and is accessible
echo "🔥 Firebase Project Status:"
if gcloud projects describe fresh-8990 >/dev/null 2>&1; then
    echo "   ✅ Project fresh-8990 exists and is accessible"
else
    echo "   ❌ Project fresh-8990 not accessible"
fi
echo ""

# Check enabled APIs
echo "🔧 Firebase APIs:"
gcloud services list --enabled --filter="name:identitytoolkit" --format="value(name)" | grep -q identitytoolkit
if [ $? -eq 0 ]; then
    echo "   ✅ Identity Toolkit API enabled"
else
    echo "   ❌ Identity Toolkit API not enabled"
fi
echo ""

# Check domain configuration
echo "🌐 Domain Configuration:"
echo "   Development: localhost:3000"
echo "   Codespace: *.app.github.dev"
echo ""

# Test API connectivity
echo "🧪 API Connectivity Test:"
if curl -s -f "https://identitytoolkit.googleapis.com/v1/projects/fresh-8990/accounts:signUp?key=$NEXT_PUBLIC_FIREBASE_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{}' >/dev/null 2>&1; then
    echo "   ✅ Firebase Auth API reachable"
else
    echo "   ❌ Firebase Auth API connection failed"
fi
echo ""

# Check OAuth client configuration
echo "🔐 OAuth Configuration:"
echo "   Domain: $NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
echo "   Project: $NEXT_PUBLIC_FIREBASE_PROJECT_ID"
echo ""

echo "💡 Common auth/internal-error causes:"
echo "   1. OAuth client not configured for this domain"
echo "   2. Authorized redirect URIs missing"
echo "   3. Google Cloud Console OAuth consent screen not configured"
echo "   4. API keys restricted to wrong domains"
echo "   5. Firebase Auth domain not matching OAuth client"
echo ""

echo "🔧 Next steps:"
echo "   1. Check Google Cloud Console OAuth client settings"
echo "   2. Verify authorized redirect URIs include:"
echo "      - https://$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN/__/auth/handler"
echo "      - http://localhost:3000"
echo "   3. Ensure OAuth consent screen is configured"
echo "   4. Check API key restrictions"