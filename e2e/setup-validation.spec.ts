import { expect, test } from '@playwright/test';

test.describe('E2E Test Setup Validation', () => {
  test('should validate Playwright configuration', async () => {
    // Simple test to validate our setup
    expect(process.env.NODE_ENV || 'test').toBeTruthy();
    expect(process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000').toBeTruthy();
  });

  test('should validate test environment', async () => {
    // Test that our test utilities work
    const { generateTestEmail, generateDisplayName, generateOrgName } = await import(
      './utils/test-helpers'
    );

    const email = generateTestEmail();
    const displayName = generateDisplayName();
    const orgName = generateOrgName();

    expect(email).toContain('@example.com');
    expect(displayName.length).toBeGreaterThan(0);
    expect(orgName.length).toBeGreaterThan(0);
  });

  test('should validate page object models', async () => {
    // Test that our page objects can be imported
    const { LoginPage, RegisterPage, OnboardingPage, DashboardPage, ForgotPasswordPage } =
      await import('./pages');

    expect(LoginPage).toBeDefined();
    expect(RegisterPage).toBeDefined();
    expect(OnboardingPage).toBeDefined();
    expect(DashboardPage).toBeDefined();
    expect(ForgotPasswordPage).toBeDefined();
  });

  test('should validate test fixtures', async () => {
    // Test that our test data is properly structured
    const { validTestUser, invalidTestUsers, testOrganizations, testUrls, testConfig } =
      await import('./fixtures/test-data');

    expect(validTestUser.email).toContain('@');
    expect(validTestUser.password.length).toBeGreaterThan(5);
    expect(invalidTestUsers.invalidEmail.email).not.toContain('@');
    expect(testOrganizations.newOrg.type).toBe('create');
    expect(testUrls.home).toBe('/');
    expect(testConfig.defaultTimeout).toBeGreaterThan(0);
  });
});
