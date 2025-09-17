# 🚀 CI/CD Pipeline Documentation

## Overview

The Fresh repository uses a comprehensive CI/CD pipeline with multiple workflows to ensure code quality, security, and performance. All workflows must pass (show green ✅) for code to be merged.

## Workflows

### 🔍 CI/CD Pipeline (`ci.yml`)

**Triggers:** Push to `main`/`develop`, Pull Requests
**Purpose:** Core validation pipeline

**Jobs:**

1. **🔍 Code Validation** - Validates code quality and functionality
   - Dependencies installation with caching
   - Build all packages
   - TypeScript type checking
   - ESLint code linting
   - Test execution with coverage
   - Coverage reporting to Codecov

2. **🔒 Security Scan** - Security vulnerability scanning
   - Dependency audit for known vulnerabilities
   - CodeQL analysis for security issues

3. **🎯 Quality Gate** - Final validation
   - Aggregates all previous job results
   - Provides clear pass/fail status
   - Blocks deployment if any checks fail

**Success Criteria:** All jobs must pass for green status ✅

### 🔒 Security (`security.yml`)

**Triggers:** Push, Pull Requests, Daily schedule (3 AM UTC)
**Purpose:** Comprehensive security scanning

**Jobs:**

1. **🛡️ Dependency Security Scan** - Scans for vulnerable dependencies
2. **🔎 CodeQL Security Analysis** - Static analysis for security vulnerabilities
3. **🔐 Secrets Detection** - Scans for accidentally committed secrets
4. **🎯 Security Summary** - Aggregates security results

**Success Criteria:** No security vulnerabilities or exposed secrets

### 📝 TODO Management (`todo.yml`)

**Triggers:** Push to `main`, Weekly schedule (Monday 9 AM UTC)
**Purpose:** Tracks and manages TODO comments in codebase

**Features:**

- Scans for TODO/FIXME/HACK comments
- Creates/updates tracking issues automatically
- Generates reports with artifact upload
- Provides codebase cleanliness metrics

### 🚀 Preview Deployment (`preview.yml`)

**Triggers:** Pull Requests to `main`
**Purpose:** Deploy preview environments for testing

**Features:**

- Creates isolated preview deployments
- Runs Lighthouse performance audits
- Comments deployment URL on PR
- Auto-cleanup when PR is closed

### 📊 Performance Monitoring (`performance.yml`)

**Triggers:** Push, Pull Requests, Daily schedule (2 AM UTC)
**Purpose:** Monitor application performance

**Jobs:**

1. **Lighthouse CI** - Core Web Vitals and performance metrics
2. **Bundle Analysis** - JavaScript bundle size monitoring
3. **Performance Regression Detection** - Compares performance between branches

### 📚 Documentation (`docs.yml`)

**Triggers:** Push to `main`
**Purpose:** Generate and update documentation

**Features:**

- TypeDoc API documentation generation
- Automatic documentation commits
- Ensures docs stay up-to-date

## Quality Gates

### Required Checks for Merge ✅

All of these must be green before merging:

1. **🔍 Code Validation** - Build, typecheck, lint, test
2. **🔒 Security Scan** - No vulnerabilities or secrets
3. **📊 Performance** - Bundle size within limits
4. **📚 Documentation** - Docs generated successfully

### Branch Protection Rules

- `main` branch requires:
  - All status checks passing
  - Up-to-date branches
  - Linear history (no merge commits)
  - Administrator enforcement

## Local Development

### Required Commands (must pass locally)

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Build all packages
pnpm build

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Testing
pnpm test

# Security audit
pnpm audit --audit-level moderate
```

### Pre-commit Hooks

Husky pre-commit hooks automatically run:

- `pnpm typecheck` - Catch type errors early
- `pnpm lint --fix` - Auto-fix linting issues
- `pnpm test` - Ensure tests pass

### Environment Setup

1. **Node.js**: 20.19.4 (specified in engines)
2. **pnpm**: 10+ for workspace features
3. **Environment variables**: Copy `.env.example` to `.env.local`

## Troubleshooting

### Common Issues

**❌ Type Checking Failed**

- Run `pnpm build` first (generates types)
- Check for missing type definitions
- Verify import paths use `.js` extensions

**❌ Linting Failed**

- Run `pnpm lint --fix` to auto-fix issues
- Check ESLint config in `eslint.config.cjs`
- Verify file patterns in ignores

**❌ Tests Failed**

- Check test output for specific failures
- Ensure Firebase credentials for integration tests
- Run tests locally: `pnpm test`

**❌ Security Issues**

- Run `pnpm audit` locally
- Update vulnerable dependencies
- Remove any committed secrets

**❌ Build Failed**

- Clear `.next` and `dist` directories
- Reinstall dependencies: `rm -rf node_modules pnpm-lock.yaml && pnpm install`
- Check for circular dependencies

### Getting Help

1. Check workflow logs in GitHub Actions tab
2. Run commands locally to reproduce issues
3. Review this documentation for configuration details
4. Create issue with error details and context

## Configuration Files

### ESLint (`eslint.config.cjs`)

- Single root configuration
- TypeScript-aware rules
- Workspace-wide patterns

### Prettier (`.prettierrc.json`)

- Code formatting standards
- Integrated with ESLint

### Husky (`.husky/`)

- Git hooks for quality enforcement
- Pre-commit and pre-push validation

### Package Scripts (`package.json`)

- Standardized commands across workspace
- Parallel execution with pnpm

## Monitoring and Metrics

### Performance Tracking

- Bundle size monitoring with alerts
- Lighthouse CI scores
- Core Web Vitals tracking

### Security Monitoring

- Daily vulnerability scans
- CodeQL security analysis
- Dependency audit automation

### Code Quality

- Test coverage reporting
- TODO/FIXME tracking
- Documentation generation

---

**Remember:** All workflows must show green ✅ status for successful merge. If any workflow fails, check the logs and fix issues before merging.
