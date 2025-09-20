# Quick Start: E2E Testing

This document provides a quick start guide for running the newly implemented e2e tests.

## Quick Commands

```bash
# Install Playwright browsers (first time only)
pnpm test:e2e:install

# Run all e2e tests
pnpm test:e2e

# Run tests with interactive UI
pnpm test:e2e:ui

# Run tests in headed mode (see browser)
pnpm test:e2e:headed

# Debug specific test
pnpm test:e2e:debug

# View test report
pnpm test:e2e:report
```

## What's Included

The e2e testing implementation covers:

1. **Authentication Flows**
   - User registration
   - User login
   - Forgot password
   - Navigation between auth pages

2. **Onboarding & Dashboard**
   - Organization creation
   - Dashboard functionality
   - User profile management
   - Invitation codes

3. **Integration Testing**
   - Complete user journeys
   - Error handling
   - Network issues
   - Mobile responsiveness
   - Performance checks

4. **Infrastructure Validation**
   - Test setup verification
   - Configuration validation
   - Utility function tests

## Test Structure

```
e2e/
├── pages/              # Page Object Models
├── utils/              # Helper functions
├── fixtures/           # Test data
├── auth.spec.ts        # Authentication tests
├── onboarding-dashboard.spec.ts  # Onboarding/dashboard tests
├── integration.spec.ts # End-to-end journeys
└── setup-validation.spec.ts     # Setup validation
```

## Key Features

- **Multi-browser testing**: Chrome, Firefox, Safari, Mobile
- **Automatic server management**: Tests start dev server automatically
- **Error handling**: Screenshots, videos, and traces on failures
- **Performance testing**: Page load time validation
- **Accessibility testing**: Keyboard navigation, proper titles
- **Mock data**: Test utilities generate unique test data

## Documentation

For detailed information, see:

- [E2E Testing Guide](./E2E_TESTING.md) - Complete documentation
- [Playwright Config](../playwright.config.ts) - Configuration details
- [GitHub Actions](../.github/workflows/e2e.yml) - CI integration

## Troubleshooting

### Common Issues

1. **Browser not installed**: Run `pnpm test:e2e:install`
2. **Server won't start**: Check that no other process is using port 3000
3. **Tests fail in CI**: Ensure proper environment variables are set

### Debug Mode

Use debug mode to step through tests:

```bash
pnpm test:e2e:debug
```

This opens a browser where you can:

- Step through each test action
- Inspect elements
- View console logs
- Analyze network requests

### Getting Help

1. Check the test report: `pnpm test:e2e:report`
2. Review the documentation: [E2E Testing Guide](./E2E_TESTING.md)
3. Use Playwright's excellent debugging tools and documentation
