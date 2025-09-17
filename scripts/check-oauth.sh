#!/bin/bash

# OAuth Status Check Script
# Verifies Google Cloud and Firebase authentication status

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Fresh OAuth Status Check${NC}"
echo "================================"
echo ""

# Check gcloud CLI
echo -e "${BLUE}📋 Google Cloud CLI Status:${NC}"
if command -v gcloud &> /dev/null; then
    echo -e "${GREEN}✅ gcloud CLI installed${NC}"
    echo "   Version: $(gcloud --version | head -1)"
    echo "   Project: $(gcloud config get-value project 2>/dev/null || echo 'Not set')"
    echo "   Account: $(gcloud config get-value account 2>/dev/null || echo 'Not set')"
else
    echo -e "${RED}❌ gcloud CLI not found${NC}"
fi
echo ""

# Check Firebase CLI
echo -e "${BLUE}🔥 Firebase CLI Status:${NC}"
if command -v firebase &> /dev/null; then
    echo -e "${GREEN}✅ Firebase CLI installed${NC}"
    echo "   Version: $(firebase --version)"
    echo "   Current project: $(firebase use 2>/dev/null | grep 'Active project' | awk '{print $NF}' || echo 'Not set')"
else
    echo -e "${RED}❌ Firebase CLI not found${NC}"
fi
echo ""

# Check authentication
echo -e "${BLUE}🔐 Authentication Status:${NC}"

# Check user authentication
if gcloud auth list --format="value(account)" 2>/dev/null | grep -q "patrickwscraven@gmail.com"; then
    echo -e "${GREEN}✅ User account authenticated (patrickwscraven@gmail.com)${NC}"
else
    echo -e "${YELLOW}⚠️  User account not authenticated${NC}"
fi

# Check service account
if gcloud auth list --format="value(account)" 2>/dev/null | grep -q "firebase-adminsdk"; then
    echo -e "${GREEN}✅ Service account available${NC}"
else
    echo -e "${YELLOW}⚠️  Service account not found${NC}"
fi

# Check Application Default Credentials
if [ -n "$GOOGLE_APPLICATION_CREDENTIALS" ] && [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo -e "${GREEN}✅ Application Default Credentials configured${NC}"
    echo "   Path: $GOOGLE_APPLICATION_CREDENTIALS"
else
    echo -e "${YELLOW}⚠️  Application Default Credentials not configured${NC}"
fi

# Test token generation
echo ""
echo -e "${BLUE}🧪 Token Generation Test:${NC}"

# Test user token
if gcloud auth print-access-token --quiet > /dev/null 2>&1; then
    echo -e "${GREEN}✅ User access token working${NC}"
else
    echo -e "${RED}❌ Cannot generate user access token${NC}"
fi

# Test ADC token
if gcloud auth application-default print-access-token --quiet > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Application Default Credentials token working${NC}"
else
    echo -e "${RED}❌ Cannot generate ADC token${NC}"
fi
echo ""

# Check Firebase services
echo -e "${BLUE}🔧 Firebase Services Status:${NC}"
if gcloud services list --enabled --filter="name:identitytoolkit" --format="value(name)" 2>/dev/null | grep -q "identitytoolkit"; then
    echo -e "${GREEN}✅ Firebase Authentication API enabled${NC}"
else
    echo -e "${RED}❌ Firebase Authentication API not enabled${NC}"
fi

if gcloud services list --enabled --filter="name:firebase.googleapis.com" --format="value(name)" 2>/dev/null | grep -q "firebase.googleapis.com"; then
    echo -e "${GREEN}✅ Firebase API enabled${NC}"
else
    echo -e "${RED}❌ Firebase API not enabled${NC}"
fi
echo ""

# Test actual authentication endpoints
echo -e "${BLUE}🌐 API Endpoint Tests:${NC}"

# Test session endpoint
if curl -s -f http://localhost:3000/api/session/current > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Session API responding${NC}"
else
    echo -e "${YELLOW}⚠️  Session API not responding (may be normal if servers not running)${NC}"
fi

# Test API health
if curl -s -f http://localhost:3333/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API server healthy${NC}"
else
    echo -e "${YELLOW}⚠️  API server not responding${NC}"
fi
echo ""

echo -e "${BLUE}💡 Quick Setup Commands:${NC}"
echo "   ./scripts/setup-oauth.sh           # Run OAuth setup"
echo "   gcloud auth login                  # Login with user account"
echo "   gcloud config set project fresh-8990  # Set project"
echo "   pnpm dev:restart                   # Restart development servers"
echo ""

# Overall status
echo -e "${BLUE}📊 Overall Status:${NC}"
if [ -n "$GOOGLE_APPLICATION_CREDENTIALS" ] && gcloud auth application-default print-access-token --quiet > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OAuth setup is working correctly!${NC}"
else
    echo -e "${YELLOW}⚠️  OAuth setup needs attention - run ./scripts/setup-oauth.sh${NC}"
fi