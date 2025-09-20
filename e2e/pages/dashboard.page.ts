import type { Locator, Page } from '@playwright/test';

/**
 * Page Object Model for the Dashboard page
 */
export class DashboardPage {
  readonly page: Page;
  readonly userProfile: Locator;
  readonly organizationCard: Locator;
  readonly invitationCode: Locator;
  readonly logoutButton: Locator;
  readonly navigationMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userProfile = page.locator('[data-testid="user-profile"], .user-profile');
    this.organizationCard = page.locator('[data-testid="organization-card"], .organization-card');
    this.invitationCode = page.locator('[data-testid="invitation-code"], .invitation-code');
    this.logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    this.navigationMenu = page.locator('nav, [role="navigation"]');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async logout() {
    await this.logoutButton.click();
  }

  async waitForDashboard() {
    // Wait for key dashboard elements to be visible
    await this.page.waitForLoadState('networkidle');
    await this.userProfile.or(this.organizationCard).waitFor({ state: 'visible', timeout: 10000 });
  }

  async getInvitationCode(): Promise<string | null> {
    if (await this.invitationCode.isVisible()) {
      return await this.invitationCode.textContent();
    }
    return null;
  }
}
