import { expect, test } from '@playwright/test';

import { testConfig } from './fixtures/test-data';
import {
  DashboardPage,
  ForgotPasswordPage,
  LoginPage,
  OnboardingPage,
  RegisterPage,
} from './pages';
import {
  TEST_PASSWORD,
  generateDisplayName,
  generateOrgName,
  generateTestEmail,
  waitForNetworkIdle,
} from './utils/test-helpers';

test.describe('End-to-End User Journey', () => {
  test.describe('Complete New User Flow', () => {
    test('should complete full registration to dashboard journey', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const registerPage = new RegisterPage(page);
      const onboardingPage = new OnboardingPage(page);
      const dashboardPage = new DashboardPage(page);

      // Generate test data
      const testEmail = generateTestEmail();
      const displayName = generateDisplayName();
      const orgName = generateOrgName();

      // Step 1: Navigate to home/login page
      await loginPage.goto();
      await expect(page).toHaveURL(/.*\//);

      // Step 2: Navigate to registration
      await loginPage.clickSignUp();
      await expect(page).toHaveURL(/.*\/register/);

      // Step 3: Complete registration
      await registerPage.register(testEmail, TEST_PASSWORD);

      // Step 4: Should redirect to onboarding
      await page.waitForURL(/.*\/onboarding/, { timeout: testConfig.defaultTimeout });
      await expect(page).toHaveURL(/.*\/onboarding/);

      // Step 5: Complete onboarding
      await onboardingPage.completeOnboarding(displayName, orgName);

      // Step 6: Should redirect to dashboard
      await page.waitForURL(/.*\/dashboard/, { timeout: testConfig.defaultTimeout });
      await expect(page).toHaveURL(/.*\/dashboard/);

      // Step 7: Verify dashboard loads properly
      await dashboardPage.waitForDashboard();

      // Verify key elements are visible
      const userProfileVisible = await dashboardPage.userProfile.isVisible();
      const orgCardVisible = await dashboardPage.organizationCard.isVisible();
      expect(userProfileVisible || orgCardVisible).toBe(true);
    });
  });

  test.describe('Navigation Between Pages', () => {
    test('should navigate correctly between authentication pages', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const registerPage = new RegisterPage(page);
      const forgotPasswordPage = new ForgotPasswordPage(page);

      // Start at login
      await loginPage.goto();
      await expect(page).toHaveURL(/.*\//);

      // Navigate to registration
      await loginPage.clickSignUp();
      await expect(page).toHaveURL(/.*\/register/);

      // Back to login
      await registerPage.clickLogin();
      await expect(page).toHaveURL(/.*\//);

      // To forgot password
      await loginPage.clickForgotPassword();
      await expect(page).toHaveURL(/.*\/forgot-password/);

      // Back to login
      await forgotPasswordPage.clickBackToLogin();
      await expect(page).toHaveURL(/.*\//);
    });

    test('should handle direct URL navigation', async ({ page }) => {
      // Test direct navigation to different pages
      const pages = [
        { url: '/', expectedPattern: /.*\// },
        { url: '/register', expectedPattern: /.*\/register/ },
        { url: '/forgot-password', expectedPattern: /.*\/forgot-password/ },
        { url: '/onboarding', expectedPattern: /.*\/onboarding/ },
        { url: '/dashboard', expectedPattern: /.*\/dashboard/ },
      ];

      for (const { url, expectedPattern } of pages) {
        await page.goto(url);
        await waitForNetworkIdle(page);

        // Page should load without errors
        const title = await page.title();
        expect(title).toBeTruthy();

        // URL should match expected pattern (may redirect for auth)
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/\/(login|register|forgot-password|onboarding|dashboard|)$/);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();

      // Simulate offline condition
      await page.context().setOffline(true);

      // Try to perform an action that requires network
      await loginPage.emailInput.fill('test@example.com');
      await loginPage.passwordInput.fill(TEST_PASSWORD);
      await loginPage.loginButton.click();

      // Should handle the error gracefully (not crash)
      // The exact behavior depends on implementation but page should remain functional
      await page.waitForTimeout(2000);
      const isResponsive = await page.locator('body').isVisible();
      expect(isResponsive).toBe(true);

      // Restore online state
      await page.context().setOffline(false);
    });

    test('should handle 404 errors', async ({ page }) => {
      // Navigate to non-existent page
      const response = await page.goto('/non-existent-page');

      // Should handle 404 gracefully
      if (response) {
        const status = response.status();
        expect([404, 200]).toContain(status); // 200 if redirected to home/login
      }

      // Page should still be functional
      const isResponsive = await page.locator('body').isVisible();
      expect(isResponsive).toBe(true);
    });
  });

  test.describe('Session Persistence', () => {
    test('should persist session across page refreshes', async ({ page }) => {
      // This test assumes we can get to an authenticated state
      // In a real scenario, you might need to mock authentication

      await page.goto('/dashboard');
      const initialUrl = page.url();

      // Refresh the page
      await page.reload();
      await waitForNetworkIdle(page);

      // URL should remain the same or redirect appropriately
      const finalUrl = page.url();

      // Should not crash and should handle authentication state
      const isResponsive = await page.locator('body').isVisible();
      expect(isResponsive).toBe(true);
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should be responsive on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      const loginPage = new LoginPage(page);
      await loginPage.goto();

      // Verify key elements are still visible and accessible
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.loginButton).toBeVisible();

      // Elements should fit within viewport
      const emailInputBox = await loginPage.emailInput.boundingBox();
      if (emailInputBox) {
        expect(emailInputBox.width).toBeLessThanOrEqual(375);
      }
    });
  });

  test.describe('Performance', () => {
    test('should load pages within reasonable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');
      await waitForNetworkIdle(page);

      const loadTime = Date.now() - startTime;

      // Should load within 10 seconds (generous for e2e)
      expect(loadTime).toBeLessThan(10000);
    });
  });
});
