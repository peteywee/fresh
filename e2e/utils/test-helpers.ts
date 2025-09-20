/**
 * Utility functions for e2e tests
 */

/**
 * Generate a unique test email address
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `test-${timestamp}-${random}@example.com`;
}

/**
 * Generate a unique organization name
 */
export function generateOrgName(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `Test Org ${timestamp} ${random}`;
}

/**
 * Generate a unique display name
 */
export function generateDisplayName(): string {
  const names = ['Alex', 'Jordan', 'Casey', 'Riley', 'Morgan', 'Taylor'];
  const adjectives = ['Creative', 'Dynamic', 'Innovative', 'Strategic', 'Efficient'];
  const name = names[Math.floor(Math.random() * names.length)];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const number = Math.floor(Math.random() * 1000);
  return `${adjective} ${name} ${number}`;
}

/**
 * Standard test password
 */
export const TEST_PASSWORD = 'TestPassword123!';

/**
 * Wait for network idle state with custom timeout
 */
export async function waitForNetworkIdle(page: any, timeout: number = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
