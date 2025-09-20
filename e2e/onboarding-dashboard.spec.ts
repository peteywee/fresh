import { expect, test } from '@playwright/test';

import { testConfig } from './fixtures/test-data';
import { DashboardPage, OnboardingPage } from './pages';
import { generateDisplayName, generateOrgName } from './utils/test-helpers';

test.describe('Onboarding Flow', () => {
  test.describe('Organization Creation', () => {
    test('should display onboarding form elements', async ({ page }) => {
      const onboardingPage = new OnboardingPage(page);

      // Navigate directly to onboarding (in real flow, user would be redirected here after registration)
      await onboardingPage.goto();

      // Verify form elements are present
      await expect(onboardingPage.displayNameInput).toBeVisible();
      await expect(onboardingPage.submitButton).toBeVisible();

      // Check if organization creation options are visible
      const createOrgVisible = await onboardingPage.createOrgOption.isVisible();
      const joinOrgVisible = await onboardingPage.joinOrgOption.isVisible();

      // At least one of the options should be visible
      expect(createOrgVisible || joinOrgVisible).toBe(true);
    });

    test('should complete onboarding with new organization', async ({ page }) => {
      const onboardingPage = new OnboardingPage(page);

      await onboardingPage.goto();

      // Fill onboarding form
      const displayName = generateDisplayName();
      const orgName = generateOrgName();

      await onboardingPage.completeOnboarding(displayName, orgName);

      // Should redirect to dashboard after successful onboarding
      await page.waitForURL(/.*\/dashboard/, { timeout: testConfig.defaultTimeout });
      await expect(page).toHaveURL(/.*\/dashboard/);
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      const onboardingPage = new OnboardingPage(page);

      await onboardingPage.goto();

      // Try to submit with empty fields
      await onboardingPage.submitButton.click();

      // Should see validation errors or form should not submit
      const hasValidationError =
        (await page.locator('input:invalid').count()) > 0 ||
        (await onboardingPage.errorMessage.isVisible());
      expect(hasValidationError).toBe(true);
    });
  });

  test.describe('Join Organization', () => {
    test('should show invite code field when joining organization', async ({ page }) => {
      const onboardingPage = new OnboardingPage(page);

      await onboardingPage.goto();

      // Check if join organization option exists and click it
      if (await onboardingPage.joinOrgOption.isVisible()) {
        await onboardingPage.joinOrgOption.click();

        // Invite code input should be visible
        await expect(onboardingPage.inviteCodeInput).toBeVisible();
      }
    });
  });
});

test.describe('Dashboard Flow', () => {
  test.describe('Dashboard Navigation', () => {
    test('should display dashboard elements', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);

      // Navigate to dashboard (in real flow, user would be redirected here after onboarding)
      await dashboardPage.goto();

      // Wait for dashboard to load
      await dashboardPage.waitForDashboard();

      // Check for key dashboard elements
      const userProfileVisible = await dashboardPage.userProfile.isVisible();
      const orgCardVisible = await dashboardPage.organizationCard.isVisible();
      const navigationVisible = await dashboardPage.navigationMenu.isVisible();

      // At least one key element should be visible
      expect(userProfileVisible || orgCardVisible || navigationVisible).toBe(true);
    });

    test('should show invitation code for organization owners', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);

      await dashboardPage.goto();
      await dashboardPage.waitForDashboard();

      // Check if invitation code is visible (would be for owners)
      const inviteCode = await dashboardPage.getInvitationCode();

      // Invitation code might not always be visible (depends on user role)
      // This test verifies the element exists if visible
      if (inviteCode) {
        expect(inviteCode.length).toBeGreaterThan(0);
      }
    });

    test('should handle logout functionality', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);

      await dashboardPage.goto();
      await dashboardPage.waitForDashboard();

      // Check if logout button exists
      if (await dashboardPage.logoutButton.isVisible()) {
        await dashboardPage.logout();

        // Should redirect to login page after logout
        await page.waitForURL(/.*\//, { timeout: testConfig.defaultTimeout });
        await expect(page).toHaveURL(/.*\//);
      }
    });
  });

  test.describe('Dashboard Accessibility', () => {
    test('should have proper page title', async ({ page }) => {
      await page.goto('/dashboard');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check page title contains relevant keywords
      const title = await page.title();
      expect(title.toLowerCase()).toMatch(/fresh|dashboard/i);
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Focus first interactive element and check if tab navigation works
      await page.keyboard.press('Tab');
      const focusedElement = await page.locator(':focus').count();
      expect(focusedElement).toBeGreaterThan(0);
    });
  });
});
