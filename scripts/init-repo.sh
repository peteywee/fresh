#!/usr/bin/env bash
set -e

# Create base repo structure
mkdir -p apps/web
mkdir -p services/auth
mkdir -p services/org
mkdir -p packages/types
mkdir -p scripts
mkdir -p docs/WTs
mkdir -p .github/workflows
mkdir -p .vscode

echo "Repo structure initialized."
