#!/usr/bin/env bash
set -euo pipefail
MSG=${1:-"Checkpoint: save state"}
BRANCH=$(git rev-parse --abbrev-ref HEAD)
git add -A
git commit -m "$MSG" || echo "Nothing to commit"
git push origin $BRANCH
