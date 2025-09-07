#!/usr/bin/env bash
# Run API + Web in parallel
trap "kill 0" EXIT
pnpm --filter @services/api dev & 
pnpm --filter @apps/web dev & 
wait
