import type { Locator, Page } from '@playwright/test';

/**
 * Page Object Model for the Registration page
 */
export class RegisterPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly registerButton: Locator;
  readonly loginLink: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]').first();
    this.confirmPasswordInput = page.locator('input[type="password"]').last();
    this.registerButton = page.getByRole('button', { name: /register|sign up|create account/i });
    this.loginLink = page.getByRole('link', { name: /login|sign in/i });
    this.errorMessage = page.locator('[role="alert"], .error-message, .text-red');
    this.successMessage = page.locator('.success-message, .text-green');
  }

  async goto() {
    await this.page.goto('/register');
  }

  async register(email: string, password: string, confirmPassword?: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);

    if (this.confirmPasswordInput && confirmPassword !== undefined) {
      await this.confirmPasswordInput.fill(confirmPassword);
    }

    await this.registerButton.click();
  }

  async clickLogin() {
    await this.loginLink.click();
  }

  async waitForError() {
    await this.errorMessage.waitFor({ state: 'visible' });
  }

  async waitForSuccess() {
    await this.successMessage.waitFor({ state: 'visible' });
  }
}
