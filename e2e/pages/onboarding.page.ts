import type { Locator, Page } from '@playwright/test';

/**
 * Page Object Model for the Onboarding page
 */
export class OnboardingPage {
  readonly page: Page;
  readonly displayNameInput: Locator;
  readonly organizationNameInput: Locator;
  readonly createOrgOption: Locator;
  readonly joinOrgOption: Locator;
  readonly inviteCodeInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.displayNameInput = page
      .locator('input[name="displayName"], input[placeholder*="name"]')
      .first();
    this.organizationNameInput = page.locator(
      'input[name="orgName"], input[placeholder*="organization"]'
    );
    this.createOrgOption = page.getByText(/create.*organization|new.*organization/i);
    this.joinOrgOption = page.getByText(/join.*organization|existing.*organization/i);
    this.inviteCodeInput = page.locator('input[name="inviteCode"], input[placeholder*="invite"]');
    this.submitButton = page.getByRole('button', { name: /continue|submit|complete|next/i });
    this.errorMessage = page.locator('[role="alert"], .error-message, .text-red');
    this.successMessage = page.locator('.success-message, .text-green');
  }

  async goto() {
    await this.page.goto('/onboarding');
  }

  async completeOnboarding(displayName: string, organizationName: string) {
    // Fill display name
    await this.displayNameInput.fill(displayName);

    // Select create organization option
    await this.createOrgOption.click();

    // Fill organization name
    await this.organizationNameInput.fill(organizationName);

    // Submit the form
    await this.submitButton.click();
  }

  async joinOrganization(displayName: string, inviteCode: string) {
    // Fill display name
    await this.displayNameInput.fill(displayName);

    // Select join organization option
    await this.joinOrgOption.click();

    // Fill invite code
    await this.inviteCodeInput.fill(inviteCode);

    // Submit the form
    await this.submitButton.click();
  }

  async waitForError() {
    await this.errorMessage.waitFor({ state: 'visible' });
  }

  async waitForSuccess() {
    await this.successMessage.waitFor({ state: 'visible' });
  }
}
