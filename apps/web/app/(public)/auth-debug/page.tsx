'use client';

import { useState } from 'react';

import { User, getAuth, onAuthStateChanged } from 'firebase/auth';

import { consumeRedirectResult, signInWithGoogle } from '@/lib/auth-google';
import { auth } from '@/lib/firebase.client';

export default function AuthDebugPage() {
  const [results, setResults] = useState<string[]>([]);
  const [serverResult, setServerResult] = useState<any>(null);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Sync Firebase client auth with server session
  const syncServerSession = async () => {
    try {
      addResult('Starting server session sync...');
      const user = auth.currentUser;
      if (!user) {
        addResult('No current user for sync');
        return;
      }

      const idToken = await user.getIdToken();
      addResult('Got ID token, posting to /api/session/login');
      const response = await fetch('/api/session/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        addResult(`Server session sync failed: ${response.status} ${errorText}`);
      } else {
        addResult('Server session sync success');
      }
    } catch (error) {
      addResult(`Error syncing server session: ${error}`);
    }
  };

  const testPopup = async () => {
    addResult('Testing popup sign-in...');
    try {
      const result = await signInWithGoogle();
      addResult(`Popup result: ${JSON.stringify(result)}`);
      if (result.ok) {
        await syncServerSession();
      }
    } catch (error) {
      addResult(`Popup error: ${error}`);
    }
  };

  const testRedirectResult = async () => {
    addResult('Checking redirect result...');
    try {
      const result = await consumeRedirectResult();
      if (result === null) {
        addResult('Redirect result: null (no redirect pending)');
      } else {
        addResult(`Redirect result: ${JSON.stringify(result)}`);
        if (result && result.ok) {
          addResult('Redirect successful, attempting server sync...');
          await syncServerSession();
        } else if (result && !result.ok) {
          addResult(`Redirect failed with error: ${result.error}`);
        }
      }
    } catch (error) {
      addResult(`Redirect result error: ${error}`);
    }
  };

  const testServerSession = async () => {
    addResult('Testing server session...');
    try {
      const response = await fetch('/api/session/me');
      const data = await response.json();
      setServerResult(data);
      addResult(`Server session: ${JSON.stringify(data)}`);
    } catch (error) {
      addResult(`Server session error: ${error}`);
    }
  };

  const checkAuthState = async () => {
    const timestamp = new Date().toISOString();
    addResult(`[${timestamp}] [auth-debug] Starting comprehensive auth state check`);

    try {
      // Get current auth instance
      const auth = getAuth();
      const user = auth.currentUser;

      addResult(
        `[${timestamp}] [auth-debug] Firebase Auth instance: ${auth ? 'available' : 'null'}`
      );
      addResult(`[${timestamp}] [auth-debug] Current user: ${user ? 'present' : 'null'}`);

      if (user) {
        addResult(`[${timestamp}] [auth-debug] User UID: ${user.uid}`);
        addResult(`[${timestamp}] [auth-debug] User email: ${user.email}`);
        addResult(`[${timestamp}] [auth-debug] User verified: ${user.emailVerified}`);
        addResult(
          `[${timestamp}] [auth-debug] Provider data: ${JSON.stringify(user.providerData)}`
        );

        // Check token validity
        try {
          const token = await user.getIdToken(false); // false = use cached token
          addResult(
            `[${timestamp}] [auth-debug] ID token (cached): ${token ? 'available' : 'null'}`
          );

          const freshToken = await user.getIdToken(true); // true = force refresh
          addResult(
            `[${timestamp}] [auth-debug] ID token (fresh): ${freshToken ? 'available' : 'null'}`
          );

          // Decode token payload for inspection
          if (freshToken) {
            const payload = JSON.parse(atob(freshToken.split('.')[1]));
            addResult(
              `[${timestamp}] [auth-debug] Token exp: ${new Date(payload.exp * 1000).toISOString()}`
            );
            addResult(
              `[${timestamp}] [auth-debug] Token iat: ${new Date(payload.iat * 1000).toISOString()}`
            );
            addResult(`[${timestamp}] [auth-debug] Token aud: ${payload.aud}`);
          }
        } catch (tokenError) {
          addResult(`[${timestamp}] [auth-debug] Token error: ${tokenError}`);
        }
      }

      // Check app state
      try {
        // App Check might not be configured, so we'll skip this check
        addResult(`[${timestamp}] [auth-debug] App Check: not configured (skipping)`);
      } catch (appCheckError) {
        addResult(`[${timestamp}] [auth-debug] App Check not configured or failed`);
      }

      // Check auth state listener
      addResult(`[${timestamp}] [auth-debug] Setting up auth state listener...`);
      const unsubscribe = onAuthStateChanged(auth, (authUser: User | null) => {
        const listenerTimestamp = new Date().toISOString();
        addResult(
          `[${listenerTimestamp}] [auth-debug] Auth state change: ${authUser ? `user ${authUser.uid}` : 'no user'}`
        );
      });

      // Clean up listener after 2 seconds
      setTimeout(() => {
        unsubscribe();
        addResult(`[${timestamp}] [auth-debug] Auth state listener cleaned up`);
      }, 2000);

      addResult(`[${timestamp}] [auth-debug] Auth state check completed`);
    } catch (error) {
      addResult(`[${timestamp}] [auth-debug] Auth state check failed: ${error}`);
    }
  };

  const clearResults = () => {
    setResults([]);
    setServerResult(null);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Firebase Auth Debug</h1>

      <div
        style={{
          marginBottom: '2rem',
          padding: '1rem',
          background: '#f8f9fa',
          borderRadius: '8px',
        }}
      >
        <h3>Current Firebase Config</h3>
        <p>
          <strong>Project ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}
        </p>
        <p>
          <strong>Auth Domain:</strong> {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}
        </p>
        <p>
          <strong>API Key:</strong>{' '}
          {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '***set***' : 'NOT SET'}
        </p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Test Actions</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={testPopup}
            style={{
              padding: '0.5rem 1rem',
              background: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Test Popup
          </button>
          <button
            onClick={testRedirectResult}
            style={{
              padding: '0.5rem 1rem',
              background: '#34a853',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Consume Redirect Result
          </button>
          <button
            onClick={syncServerSession}
            style={{
              padding: '0.5rem 1rem',
              background: '#fbbc04',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Sync Server Session
          </button>
          <button
            onClick={testServerSession}
            style={{
              padding: '0.5rem 1rem',
              background: '#ea4335',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Test Server /api/session/me
          </button>
          <button
            onClick={checkAuthState}
            style={{
              padding: '0.5rem 1rem',
              background: '#9c27b0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Check Auth State
          </button>
          <button
            onClick={clearResults}
            style={{
              padding: '0.5rem 1rem',
              background: '#9aa0a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Clear Results
          </button>
        </div>
      </div>

      {serverResult && (
        <div
          style={{
            marginBottom: '2rem',
            padding: '1rem',
            background: '#e8f5e8',
            borderRadius: '8px',
          }}
        >
          <h3>Server Session State</h3>
          <pre
            style={{ background: 'white', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}
          >
            {JSON.stringify(serverResult, null, 2)}
          </pre>
        </div>
      )}

      <div>
        <h3>Console Log</h3>
        <div
          style={{
            height: '300px',
            overflow: 'auto',
            background: '#f8f9fa',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
          }}
        >
          {results.length === 0 ? (
            <p style={{ color: '#6c757d', fontStyle: 'italic' }}>
              No results yet. Try the buttons above.
            </p>
          ) : (
            results.map((result, index) => (
              <div
                key={index}
                style={{ marginBottom: '0.5rem', fontFamily: 'monospace', fontSize: '0.9rem' }}
              >
                {result}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
