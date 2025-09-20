# End-to-End Testing Guide for Fresh

## Overview

This document explains how to set up, run, and maintain e2e tests for the Fresh application using Playwright.

## Prerequisites

- Node.js 20.19.4+
- pnpm 10+
- Fresh development environment set up

## Installation

1. Install dependencies (including Playwright):

   ```bash
   pnpm install
   ```

2. Install Playwright browsers:
   ```bash
   pnpm test:e2e:install
   ```

## Running E2E Tests

### Basic Commands

```bash
# Run all e2e tests
pnpm test:e2e

# Run tests with UI (interactive mode)
pnpm test:e2e:ui

# Run tests in headed mode (see browser)
pnpm test:e2e:headed

# Debug tests step by step
pnpm test:e2e:debug

# View test report
pnpm test:e2e:report
```

### Running Specific Tests

```bash
# Run only authentication tests
npx playwright test auth.spec.ts

# Run only setup validation tests
npx playwright test setup-validation.spec.ts

# Run tests in a specific browser
npx playwright test --project=chromium

# Run tests with specific tag
npx playwright test --grep "Authentication Flow"
```

## Test Structure

### Test Organization

```
e2e/
├── fixtures/           # Test data and mock objects
│   └── test-data.ts    # Common test data
├── pages/              # Page Object Models
│   ├── login.page.ts
│   ├── register.page.ts
│   ├── onboarding.page.ts
│   ├── dashboard.page.ts
│   ├── forgot-password.page.ts
│   └── index.ts
├── utils/              # Helper functions
│   └── test-helpers.ts
├── auth.spec.ts        # Authentication flow tests
├── onboarding-dashboard.spec.ts  # Onboarding and dashboard tests
├── integration.spec.ts # Full user journey tests
└── setup-validation.spec.ts     # Configuration validation
```

### Key Test Files

1. **auth.spec.ts**: Tests user registration, login, and password reset flows
2. **onboarding-dashboard.spec.ts**: Tests onboarding process and dashboard functionality
3. **integration.spec.ts**: End-to-end user journeys and integration scenarios
4. **setup-validation.spec.ts**: Validates test setup and configuration

## Page Object Models

Our tests use the Page Object Model pattern for better maintainability:

```typescript
// Example usage
import { LoginPage, RegisterPage } from './pages';

test('should login successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login('test@example.com', 'password123');

  // Verify successful login
  await expect(page).toHaveURL('/dashboard');
});
```

## Test Data Management

### Test Utilities

```typescript
import { TEST_PASSWORD, generateDisplayName, generateTestEmail } from './utils/test-helpers';

// Generate unique test data
const email = generateTestEmail(); // Returns: test-1234567890-abc123@example.com
const name = generateDisplayName(); // Returns: Creative Alex 456
const password = TEST_PASSWORD; // Standard test password
```

### Test Fixtures

```typescript
import { testOrganizations, testUrls, validTestUser } from './fixtures/test-data';

// Use predefined test data
await registerPage.register(validTestUser.email, validTestUser.password);
```

## Configuration

### Environment Variables

The tests automatically configure mock environment variables for Firebase and other services:

```javascript
// Playwright automatically sets these for testing
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
// ... other test environment variables
```

### Browser Configuration

Tests run on multiple browsers and devices:

- Desktop: Chrome, Firefox, Safari
- Mobile: Chrome Mobile, Safari Mobile

### Test Server

Playwright automatically starts the development server before running tests:

- URL: http://localhost:3000
- Command: `pnpm dev:web`
- Timeout: 2 minutes

## Writing New Tests

### Basic Test Structure

```typescript
import { expect, test } from '@playwright/test';

import { LoginPage } from './pages';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    // Test steps...

    await expect(page).toHaveURL('/expected-url');
  });
});
```

### Best Practices

1. **Use Page Objects**: Always use page object models for element interaction
2. **Generate Test Data**: Use helper functions to generate unique test data
3. **Wait Appropriately**: Use proper waits for dynamic content
4. **Test Real Flows**: Focus on complete user journeys
5. **Handle Errors**: Test both success and failure scenarios

### Adding New Page Objects

1. Create a new page class in `e2e/pages/`
2. Export it from `e2e/pages/index.ts`
3. Follow existing patterns for locators and methods

```typescript
// e2e/pages/new-page.page.ts
import type { Locator, Page } from '@playwright/test';

export class NewPage {
  readonly page: Page;
  readonly element: Locator;

  constructor(page: Page) {
    this.page = page;
    this.element = page.locator('[data-testid="element"]');
  }

  async goto() {
    await this.page.goto('/new-page');
  }

  async doSomething() {
    await this.element.click();
  }
}
```

## Debugging Tests

### Interactive Debugging

```bash
# Open Playwright UI for debugging
pnpm test:e2e:ui

# Run with browser visible
pnpm test:e2e:headed

# Step through tests
pnpm test:e2e:debug
```

### Debugging Tips

1. **Screenshots**: Automatically captured on test failures
2. **Videos**: Recorded for failed tests
3. **Traces**: Available for retried tests
4. **Console Logs**: Check browser console in reports

## CI/CD Integration

### Running in CI

Tests are configured to run efficiently in CI environments:

- Single worker (no parallel execution)
- 2 retries on failure
- HTML and JSON reports generated

### Environment Setup

For CI environments, ensure:

1. Node.js 20.19.4+ is available
2. Install Playwright browsers: `npx playwright install`
3. Set appropriate timeouts for slower CI machines

## Troubleshooting

### Common Issues

1. **Browser Installation Failures**:

   ```bash
   # Manually install browsers
   npx playwright install chromium
   ```

2. **Server Start Timeout**:
   - Increase timeout in `playwright.config.ts`
   - Check if development server starts manually

3. **Element Not Found**:
   - Verify selectors in page objects
   - Check if page is fully loaded
   - Use `page.pause()` for debugging

4. **Test Flakiness**:
   - Add proper waits for dynamic content
   - Use `page.waitForLoadState('networkidle')`
   - Increase timeouts if needed

### Getting Help

1. Check Playwright documentation: https://playwright.dev
2. Review test reports in `playwright-report/`
3. Use browser dev tools to inspect elements
4. Add debug logs with `console.log()` in tests

## Maintenance

### Regular Tasks

1. **Update Dependencies**: Keep Playwright and browsers updated
2. **Review Selectors**: Update page objects when UI changes
3. **Test Data Cleanup**: Ensure test data doesn't accumulate
4. **Performance Monitoring**: Watch for test execution time increases

### Best Practices for Maintenance

1. Run tests frequently during development
2. Update page objects when UI changes
3. Add tests for new features
4. Remove tests for deprecated features
5. Keep test data and utilities up to date
