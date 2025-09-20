import type { Locator, Page } from '@playwright/test';

/**
 * Page Object Model for the Login page
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly signUpLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.getByRole('button', { name: /login|sign in/i });
    this.signUpLink = page.getByRole('link', { name: /sign up|register/i });
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot password/i });
    this.errorMessage = page.locator('[role="alert"], .error-message, .text-red');
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async clickSignUp() {
    await this.signUpLink.click();
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async waitForError() {
    await this.errorMessage.waitFor({ state: 'visible' });
  }
}
