/**
 * Test fixtures and mock data for e2e tests
 */

export interface TestUser {
  email: string;
  password: string;
  displayName: string;
}

export interface TestOrganization {
  name: string;
  type: 'create' | 'join';
  inviteCode?: string;
}

/**
 * Valid test user data
 */
export const validTestUser: TestUser = {
  email: 'valid-test@example.com',
  password: 'ValidPassword123!',
  displayName: 'Valid Test User',
};

/**
 * Invalid test user data for negative testing
 */
export const invalidTestUsers = {
  invalidEmail: {
    email: 'invalid-email',
    password: 'ValidPassword123!',
    displayName: 'Test User',
  },
  shortPassword: {
    email: 'test@example.com',
    password: '123',
    displayName: 'Test User',
  },
  emptyFields: {
    email: '',
    password: '',
    displayName: '',
  },
};

/**
 * Test organization data
 */
export const testOrganizations = {
  newOrg: {
    name: 'Fresh Test Organization',
    type: 'create' as const,
  },
  existingOrg: {
    name: 'Existing Organization',
    type: 'join' as const,
    inviteCode: 'TEST123',
  },
};

/**
 * Common test URLs
 */
export const testUrls = {
  home: '/',
  login: '/', // home redirects to login for unauthenticated users
  register: '/register',
  onboarding: '/onboarding',
  dashboard: '/dashboard',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
};

/**
 * Test environment configuration
 */
export const testConfig = {
  defaultTimeout: 30000,
  shortTimeout: 5000,
  longTimeout: 60000,
  retryAttempts: 3,
};
