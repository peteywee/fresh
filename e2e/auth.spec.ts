import { expect, test } from '@playwright/test';

import { testConfig } from './fixtures/test-data';
import { DashboardPage, LoginPage, RegisterPage } from './pages';
import { TEST_PASSWORD, generateDisplayName, generateTestEmail } from './utils/test-helpers';

test.describe('Authentication Flow', () => {
  test.describe('User Registration', () => {
    test('should successfully register a new user', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const registerPage = new RegisterPage(page);

      // Navigate to login page
      await loginPage.goto();

      // Click sign up link
      await loginPage.clickSignUp();

      // Verify we're on registration page
      await expect(page).toHaveURL(/.*\/register/);

      // Fill registration form
      const testEmail = generateTestEmail();
      const testDisplayName = generateDisplayName();
      await registerPage.register(testEmail, TEST_PASSWORD);

      // Wait for successful registration
      // The user should be redirected to onboarding or dashboard
      await page.waitForURL(/.*\/(onboarding|dashboard)/, { timeout: testConfig.defaultTimeout });

      // Verify we're on the expected page
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/(onboarding|dashboard)/);
    });

    test('should show error for invalid email', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const registerPage = new RegisterPage(page);

      await loginPage.goto();
      await loginPage.clickSignUp();

      // Try to register with invalid email
      await registerPage.register('invalid-email', TEST_PASSWORD);

      // Should see error message or validation
      const hasError =
        (await page.locator('input[type="email"]:invalid').count()) > 0 ||
        (await registerPage.errorMessage.isVisible());
      expect(hasError).toBe(true);
    });

    test('should show error for weak password', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const registerPage = new RegisterPage(page);

      await loginPage.goto();
      await loginPage.clickSignUp();

      // Try to register with weak password
      const testEmail = generateTestEmail();
      await registerPage.register(testEmail, '123');

      // Should see error or validation
      const hasError =
        (await page.locator('input[type="password"]:invalid').count()) > 0 ||
        (await registerPage.errorMessage.isVisible());
      expect(hasError).toBe(true);
    });
  });

  test.describe('User Login', () => {
    test('should navigate to login page from home', async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();

      // Verify login form elements are present
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.loginButton).toBeVisible();
      await expect(loginPage.signUpLink).toBeVisible();
      await expect(loginPage.forgotPasswordLink).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();

      // Try to login with invalid credentials
      await loginPage.login('invalid@example.com', 'wrongpassword');

      // Should see error message
      await loginPage.waitForError();
      await expect(loginPage.errorMessage).toBeVisible();
    });

    test('should navigate between login and registration', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const registerPage = new RegisterPage(page);

      // Start at login page
      await loginPage.goto();
      await expect(page).toHaveURL(/.*\//);

      // Go to registration
      await loginPage.clickSignUp();
      await expect(page).toHaveURL(/.*\/register/);

      // Go back to login
      await registerPage.clickLogin();
      await expect(page).toHaveURL(/.*\//);
    });
  });

  test.describe('Forgot Password Flow', () => {
    test('should navigate to forgot password page', async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.clickForgotPassword();

      // Verify we're on forgot password page
      await expect(page).toHaveURL(/.*\/forgot-password/);
    });

    test('should show form elements on forgot password page', async ({ page }) => {
      await page.goto('/forgot-password');

      // Verify form elements are present
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.getByRole('button', { name: /send|reset|submit/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /back to login|login/i })).toBeVisible();
    });
  });
});
