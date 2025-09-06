mkdir -p .github

cat > .github/copilot-instructions.md <<'EOF'
# Copilot Instructions — GPT Assistant Scheduler (VS Code)

> Purpose: Guide Copilot to systematically scaffold, customize, and validate the GPT assistant for the Scheduler project inside VS Code.  
> Context: Project type is **TypeScript microservices** with **Next.js front-end**, **Zod schemas**, and **task orchestration API**. Use `.` as the working directory.

## Checklist

- [ ] **Verify Copilot File Presence**  
  - Confirm this file exists at `.github/copilot-instructions.md`.

- [ ] **Confirm Project Context**  
  - Project type is fixed: Node.js/TypeScript microservices with Next.js.  
  - Frameworks: Next.js (frontend), Express/Cloudflare Worker (backend API), Zod (contracts), pnpm (package manager).  
  - Skip generic clarification.

- [ ] **Scaffold Scheduler Project**  
  - Create base structure:  
    - `apps/web` (Next.js UI)  
    - `services/api` (Task orchestration API)  
    - `packages/types` (shared Zod schemas & types)  
  - Use pnpm workspaces.  
  - Scaffold using `.`, do not create extra folders.  

- [ ] **Customize Codebase**  
  - Implement Walkthroughs (WT-###) per standing spec:  
    - User Story  
    - Acceptance Criteria  
    - Preconditions  
    - Happy Path  
    - Edge Cases  
    - Routing & Guards  
    - Data Contracts (TypeScript + Zod)  
    - API Contracts  
    - File Map (exhaustive)  
    - Full Code (by file)  
  - Start with WT-001 (first-time login, org declaration, onboarding, role assignment).  

- [ ] **Install Required Extensions**  
  - Only install extensions specified by `get_project_setup_info`. Skip if none.  

- [ ] **Compile Scheduler**  
  - Install dependencies with pnpm.  
  - Ensure Next.js compiles and API service builds without errors.  
  - Resolve TypeScript and lint issues.  

- [ ] **Create & Run Tasks**  
  - Generate `.vscode/tasks.json` for:  
    - `pnpm dev:web` → run Next.js app  
    - `pnpm dev:api` → run orchestration API  
  - Run tasks to validate services.  

- [ ] **Launch Scheduler**  
  - Confirm web at `http://localhost:3000` and API at `http://localhost:3333`.  
  - Prompt user if debug mode is needed.  

- [ ] **Finalize Documentation**  
  - Ensure `README.md` and `.github/copilot-instructions.md` are present.  
  - Update README with current state (how to run web + API, walkthrough index).  
  - Keep this file free of HTML comments.  

---

## Execution Guidelines

### Progress Tracking
- Update checklist status after each step with a one-line summary.  
- Read current status before starting next step.

### Communication Rules
- Responses concise and technical.  
- If skipping a step, state briefly (e.g., “No extensions needed”).  
- Do not describe full structure unless requested.

### Development Rules
- Always use `.` as root.  
- Scaffold and customize with pnpm + VS Code tasks.  
- Follow WT-### format rigorously.  
- Keep extensions minimal; install only if explicitly listed.  

### Completion Criteria
Task is complete when:  
1. Scheduler project scaffolds and compiles.  
2. Copilot instructions file exists here.  
3. README is accurate and current.  
4. VS Code tasks launch web + API services successfully.  

EOF
