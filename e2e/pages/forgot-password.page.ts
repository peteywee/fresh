import type { Locator, Page } from '@playwright/test';

/**
 * Page Object Model for the Forgot Password page
 */
export class ForgotPasswordPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly backToLoginLink: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.submitButton = page.getByRole('button', { name: /send|reset|submit/i });
    this.backToLoginLink = page.getByRole('link', { name: /back to login|login/i });
    this.errorMessage = page.locator('[role="alert"], .error-message, .text-red');
    this.successMessage = page.locator('.success-message, .text-green');
  }

  async goto() {
    await this.page.goto('/forgot-password');
  }

  async requestPasswordReset(email: string) {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }

  async clickBackToLogin() {
    await this.backToLoginLink.click();
  }

  async waitForError() {
    await this.errorMessage.waitFor({ state: 'visible' });
  }

  async waitForSuccess() {
    await this.successMessage.waitFor({ state: 'visible' });
  }
}
