#!/bin/bash

# Google OAuth Codespaces Setup Helper
# This script helps configure Google OAuth for GitHub Codespaces development

set -e

echo "🔍 Google OAuth Codespaces Configuration Helper"
echo "=============================================="
echo ""

# Get environment info
if [ -n "$CODESPACE_NAME" ]; then
    CODESPACE_URL="https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
    echo "✅ GitHub Codespaces detected"
    echo "   Codespace: $CODESPACE_NAME"
    echo "   App URL: $CODESPACE_URL"
else
    echo "❌ Not running in GitHub Codespaces"
    exit 1
fi

echo ""
echo "🔧 Required Google Cloud Console Configuration:"
echo "=============================================="
echo ""
echo "1. Go to Google Cloud Console: https://console.cloud.google.com"
echo "2. Select project: fresh-8990"
echo "3. Navigate to: APIs & Services > Credentials"
echo "4. Find your OAuth 2.0 Client ID"
echo "5. Add these authorized domains:"
echo ""
echo "   Authorized JavaScript origins:"
echo "   • https://localhost:3000"
echo "   • $CODESPACE_URL"
echo "   • https://*.app.github.dev"
echo ""
echo "   Authorized redirect URIs:"
echo "   • https://localhost:3000/__/auth/handler"
echo "   • ${CODESPACE_URL}/__/auth/handler"
echo ""

# Check current Firebase config
echo "🔍 Current Firebase Configuration:"
echo "================================="
echo ""

# Test Firebase config endpoint
if curl -s http://localhost:3000/api/public/firebase-config >/dev/null 2>&1; then
    echo "✅ Firebase config accessible"
    curl -s http://localhost:3000/api/public/firebase-config | jq -r '.authDomain // "Not found"' | sed 's/^/   Auth Domain: /'
else
    echo "❌ Cannot access Firebase config"
fi

echo ""
echo "🧪 Testing OAuth Configuration:"
echo "==============================="
echo ""

# Test the current URL
if curl -s "$CODESPACE_URL" >/dev/null 2>&1; then
    echo "✅ Codespace URL accessible: $CODESPACE_URL"
else
    echo "❌ Codespace URL not accessible"
fi

echo ""
echo "⚡ Quick Fix Options:"
echo "===================="
echo ""
echo "1. **Add domains to Google Cloud Console** (Recommended)"
echo "   - Fastest permanent solution"
echo "   - Allows OAuth to work properly"
echo ""
echo "2. **Use port forwarding to localhost**"
echo "   - Forward Codespace to localhost:3000"
echo "   - Works with existing OAuth config"
echo ""
echo "3. **Test with different OAuth settings**"
echo "   - Temporarily modify provider settings"
echo "   - May need additional scopes"
echo ""

echo "🔗 Useful Links:"
echo "==============="
echo "• Google Cloud Console: https://console.cloud.google.com/apis/credentials?project=fresh-8990"
echo "• Firebase Console: https://console.firebase.google.com/project/fresh-8990/authentication/providers"
echo "• OAuth Debug: https://developers.google.com/identity/protocols/oauth2/web-server#handlingresponse"
echo ""

echo "📝 Next Steps:"
echo "============="
echo "1. Configure Google Cloud Console with the domains above"
echo "2. Wait 5-10 minutes for changes to propagate"
echo "3. Test Google Sign-in again"
echo "4. If still failing, check browser console for detailed errors"