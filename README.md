# GPT Assistant — Scheduler

Monorepo (pnpm) with:

## Run (VS Code)

## Health checks
	```bash
	curl -s \
		-H 'x-run-id: run-abc-001' \
		-H 'x-user: patrick' \
		-H 'x-obj: onboarding' \
		-H 'x-task: WT-001' \
		-H 'x-step: AC1' \
		http://localhost:3333/hierarchy/echo | jq .
	```
# GPT Assistant — Scheduler

Monorepo (pnpm) with:

- `apps/web` — Next.js UI
- `services/api` — Express orchestration API
- `packages/types` — Shared types/schemas (Zod-ready)

## Run (VS Code)

- Tasks: `dev:web` and `dev:api` (see `.vscode/tasks.json`)
- **Process Management**: Use VS Code tasks or scripts for development workflow
- Web: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:3333](http://localhost:3333)

### Quick Start
```bash
# Start development environment
pnpm dev:restart

# Kill processes and restart (if things get stuck)  
pnpm dev:kill
pnpm dev:restart

# Check status
pnpm dev:status
```

See [Process Management Guide](docs/PROCESS_MANAGEMENT.md) for full workflow documentation.

## Health checks

- API: `curl -s http://localhost:3333/health | jq .`
- Probe: `curl -s -H 'x-run-id: run-abc' http://localhost:3333/__/probe | jq .`
- Echo:

```bash
curl -s \
	-H 'x-run-id: run-abc-001' \
	-H 'x-user: patrick' \
	-H 'x-obj: onboarding' \
	-H 'x-task: WT-001' \
	-H 'x-step: AC1' \
	http://localhost:3333/hierarchy/echo | jq .
```
