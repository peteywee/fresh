'use client';

import { useEffect, useState } from 'react';

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

import { auth } from '@/lib/firebase.client';

export default function AuthErrorTestPage() {
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setUser(user);
      console.log('Auth state:', user ? `Logged in as ${user.email}` : 'Not logged in');
    });
    return () => unsubscribe();
  }, []);

  const testGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      console.log('Attempting Google sign-in...');
      const result = await signInWithPopup(auth, provider);
      console.log('Sign-in successful:', result.user.email);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setError(`${err.code}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'monospace' }}>
      <h1>🔍 Auth Error Test</h1>

      <div style={{ marginBottom: 20 }}>
        <p>
          <strong>Current User:</strong> {user ? user.email : 'Not signed in'}
        </p>
        <p>
          <strong>Firebase Auth Domain:</strong> {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}
        </p>
        <p>
          <strong>Current Domain:</strong>{' '}
          {typeof window !== 'undefined' ? window.location.hostname : 'unknown'}
        </p>
      </div>

      <button
        onClick={testGoogleSignIn}
        disabled={loading}
        style={{
          padding: '12px 24px',
          backgroundColor: loading ? '#ccc' : '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Testing...' : 'Test Google Sign-In'}
      </button>

      {error && (
        <div
          style={{
            marginTop: 20,
            padding: 15,
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            color: '#991b1b',
          }}
        >
          <h3>🚨 Error Details:</h3>
          <pre style={{ fontSize: 12, fontFamily: 'monospace' }}>{error}</pre>

          {error.includes('unauthorized-domain') && (
            <div style={{ marginTop: 10, fontSize: 14 }}>
              <strong>✅ Solution:</strong> Add "localhost" to Firebase Console → Authentication →
              Settings → Authorized domains
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 20, fontSize: 12, color: '#666' }}>
        <p>This page will show the exact Firebase auth error code to help diagnose the issue.</p>
      </div>
    </div>
  );
}
