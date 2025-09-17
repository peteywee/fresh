import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin') || req.url;
  const userAgent = req.headers.get('user-agent') || '';

  // Check if we're in Codespaces
  const isCodespaces = process.env.CODESPACES === 'true';
  const codespaceName = process.env.CODESPACE_NAME;
  const codespacesDomain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;

  // Build expected OAuth configuration
  const baseOrigins = ['http://localhost:3000', 'https://localhost:3000'];

  const expectedOrigins = [...baseOrigins];
  if (isCodespaces && codespaceName && codespacesDomain) {
    const codespaceUrl = `https://${codespaceName}-3000.${codespacesDomain}`;
    expectedOrigins.push(codespaceUrl, `https://*.${codespacesDomain}`);
  }

  const expectedRedirects = expectedOrigins.map(o => `${o}/__/auth/handler`);

  // Configuration recommendations
  const recommendations = [];
  if (isCodespaces) {
    recommendations.push(
      'Add Codespace domain to Google Cloud Console OAuth configuration',
      'Consider using port forwarding for development',
      'Ensure Firebase project allows authentication from Codespaces domains'
    );
  } else {
    recommendations.push(
      'Verify localhost is configured in OAuth client',
      'Check Firebase authentication domain settings',
      'Ensure OAuth client has correct redirect URIs'
    );
  }

  return NextResponse.json({
    environment: {
      isCodespaces,
      codespaceName,
      codespacesDomain,
      origin,
      userAgent: userAgent.substring(0, 100), // Truncate for privacy
    },
    oauth: {
      expectedOrigins,
      expectedRedirects,
      recommendations,
    },
    links: {
      googleCloudConsole: 'https://console.cloud.google.com/apis/credentials?project=fresh-8990',
      firebaseConsole:
        'https://console.firebase.google.com/project/fresh-8990/authentication/providers',
      documentation: 'https://developers.google.com/identity/protocols/oauth2/web-server',
    },
    message: isCodespaces
      ? 'Running in GitHub Codespaces - OAuth client needs Codespace domain configuration'
      : 'Running locally - verify OAuth client localhost configuration',
  });
}
