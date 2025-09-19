export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    config: {
      hasApiKey: !!config.apiKey,
      hasAuthDomain: !!config.authDomain,
      hasProjectId: !!config.projectId,
      authDomain: config.authDomain,
      projectId: config.projectId,
    },
    potentialIssues: [] as string[],
  };

  // Check for common issues
  if (!config.apiKey) diagnostics.potentialIssues.push('Missing NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!config.authDomain)
    diagnostics.potentialIssues.push('Missing NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!config.projectId)
    diagnostics.potentialIssues.push('Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID');

  // Check if localhost is likely authorized
  if (config.authDomain && !config.authDomain.includes('localhost')) {
    diagnostics.potentialIssues.push(
      'Auth domain does not include localhost - may need to add localhost:3000 to Firebase Console > Authentication > Settings > Authorized domains'
    );
  }

  return Response.json(diagnostics, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
