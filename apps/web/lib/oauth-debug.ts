/**
 * OAuth Development Helper
 * Provides debugging information for Google OAuth configuration issues
 */

export interface OAuthDebugInfo {
  currentUrl: string;
  isCodespaces: boolean;
  expectedOrigins: string[];
  expectedRedirects: string[];
  firebaseConfig: any;
  suggestions: string[];
}

export function getOAuthDebugInfo(): OAuthDebugInfo {
  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const isCodespaces =
    currentUrl.includes('.app.github.dev') ||
    (typeof process !== 'undefined' && process.env.CODESPACES === 'true');

  const baseOrigins = ['http://localhost:3000', 'https://localhost:3000'];

  const expectedOrigins = isCodespaces
    ? [...baseOrigins, currentUrl, 'https://*.app.github.dev']
    : baseOrigins;

  const expectedRedirects = expectedOrigins.map(origin => `${origin}/__/auth/handler`);

  const suggestions = [];

  if (isCodespaces) {
    suggestions.push(
      'Add your Codespace domain to Google Cloud Console OAuth configuration',
      'Or use port forwarding to test on localhost',
      'Consider using a dedicated development OAuth client for Codespaces'
    );
  } else {
    suggestions.push(
      'Verify localhost is configured in Google Cloud Console',
      'Check that OAuth client is properly set up',
      'Ensure Firebase project configuration is correct'
    );
  }

  // Try to get Firebase config if available
  let firebaseConfig = null;
  if (typeof window !== 'undefined') {
    try {
      // This will be populated by the Firebase client
      firebaseConfig = (window as any).__FIREBASE_CONFIG__ || null;
    } catch (error) {
      // Ignore errors when accessing Firebase config
    }
  }

  return {
    currentUrl,
    isCodespaces,
    expectedOrigins,
    expectedRedirects,
    firebaseConfig,
    suggestions,
  };
}

export function logOAuthDebugInfo() {
  const info = getOAuthDebugInfo();

  console.group('🔍 OAuth Debug Information');
  console.log('Current URL:', info.currentUrl);
  console.log('Is Codespaces:', info.isCodespaces);
  console.log('Expected Origins:', info.expectedOrigins);
  console.log('Expected Redirects:', info.expectedRedirects);
  console.log('Firebase Config:', info.firebaseConfig);
  console.log('Suggestions:', info.suggestions);
  console.groupEnd();

  return info;
}
