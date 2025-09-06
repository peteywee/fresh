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
- Web: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:3333](http://localhost:3333)

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
