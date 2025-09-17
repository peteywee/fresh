#!/bin/bash

# Fresh OAuth Setup Script
# Sets up Google Cloud CLI and Firebase authentication for development

set -e

echo "🔧 Setting up OAuth for Fresh development environment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI not found. Please install it first."
    exit 1
fi

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first."
    exit 1
fi

echo -e "${BLUE}📋 Current gcloud configuration:${NC}"
echo "Project: $(gcloud config get-value project)"
echo "Account: $(gcloud config get-value account)"
echo ""

# Set up environment variable for service account
SERVICE_ACCOUNT_PATH="/workspaces/fresh/secrets/firebase-admin.json"
if [ -f "$SERVICE_ACCOUNT_PATH" ]; then
    echo -e "${GREEN}✅ Setting up Application Default Credentials...${NC}"
    export GOOGLE_APPLICATION_CREDENTIALS="$SERVICE_ACCOUNT_PATH"
    echo "export GOOGLE_APPLICATION_CREDENTIALS=\"$SERVICE_ACCOUNT_PATH\"" >> ~/.bashrc
    
    # Activate service account for gcloud operations that need it
    gcloud auth activate-service-account --key-file="$SERVICE_ACCOUNT_PATH" --quiet
    echo -e "${GREEN}✅ Service account activated${NC}"
else
    echo -e "${YELLOW}⚠️  Service account key not found at $SERVICE_ACCOUNT_PATH${NC}"
fi

# Switch back to user account for most operations
if gcloud auth list --format="value(account)" | grep -q "patrickwscraven@gmail.com"; then
    gcloud config set account patrickwscraven@gmail.com
    echo -e "${GREEN}✅ User account set as active${NC}"
fi

# Verify Firebase project configuration
echo -e "${BLUE}🔥 Firebase project status:${NC}"
firebase use fresh-8990
echo ""

# Test authentication
echo -e "${BLUE}🧪 Testing authentication...${NC}"

# Test gcloud auth
if gcloud auth print-access-token --quiet > /dev/null 2>&1; then
    echo -e "${GREEN}✅ gcloud authentication working${NC}"
else
    echo -e "${YELLOW}⚠️  gcloud authentication needs attention${NC}"
fi

# Test Application Default Credentials
if gcloud auth application-default print-access-token --quiet > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Application Default Credentials working${NC}"
else
    echo -e "${YELLOW}⚠️  Application Default Credentials need setup${NC}"
fi

# List enabled Firebase services
echo -e "${BLUE}🔍 Enabled Firebase services:${NC}"
gcloud services list --enabled --filter="name:firebase OR name:identitytoolkit" --format="value(name)" | sed 's/.*\///' | sort

echo ""
echo -e "${GREEN}🎉 OAuth setup complete!${NC}"
echo ""
echo -e "${YELLOW}💡 Environment variables set:${NC}"
echo "   GOOGLE_APPLICATION_CREDENTIALS=$GOOGLE_APPLICATION_CREDENTIALS"
echo ""
echo -e "${YELLOW}📚 Useful commands:${NC}"
echo "   gcloud auth list                    # List authenticated accounts"
echo "   gcloud config get-value project     # Show current project"
echo "   firebase projects:list              # List Firebase projects"
echo "   gcloud services list --enabled      # Show enabled APIs"