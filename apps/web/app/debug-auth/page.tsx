'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { User, onAuthStateChanged, signOut } from 'firebase/auth';

import { consumeRedirectResult, signInWithGoogle } from '@/lib/auth-google';
import { auth } from '@/lib/firebase.client';

export default function DebugPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [debug, setDebug] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addDebug = (message: string) => {
    console.log(`[DEBUG] ${message}`);
    setDebug(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Consume redirect result on mount
  useEffect(() => {
    addDebug('Component mounted, checking redirect result...');
    (async () => {
      try {
        const result = await consumeRedirectResult();
        if (result) {
          addDebug(`Redirect result: ${result.ok ? 'SUCCESS' : 'ERROR: ' + result.error}`);
        } else {
          addDebug('No redirect result found');
        }
      } catch (err: any) {
        addDebug(`Redirect result error: ${err.message}`);
      }
    })();
  }, []);

  useEffect(() => {
    addDebug('Setting up auth state listener...');
    if (!auth) {
      addDebug('Auth not initialized');
      setReady(true);
      return;
    }
    const unsub = onAuthStateChanged(auth, u => {
      addDebug(`Auth state changed: ${u ? `USER: ${u.email}` : 'NO USER'}`);
      setUser(u);
      setReady(true);
    });
    return () => {
      addDebug('Cleaning up auth listener');
      unsub();
    };
  }, [router]);

  const handleGoogleSignIn = async () => {
    addDebug('Google Sign-In button clicked');
    setLoading(true);

    try {
      addDebug('Calling signInWithGoogle...');
      const result = await signInWithGoogle();
      addDebug(`Sign-in result: ${JSON.stringify(result)}`);

      if (result.ok) {
        addDebug('Sign-in successful!');
      } else {
        addDebug(`Sign-in failed: ${result.error}`);
      }
    } catch (err: any) {
      addDebug(`Sign-in exception: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Debug: Checking Auth State...</h1>
        <div style={{ marginTop: 20 }}>
          <h3>Debug Log:</h3>
          <div
            style={{
              backgroundColor: '#f5f5f5',
              padding: 10,
              fontFamily: 'monospace',
              fontSize: 12,
            }}
          >
            {debug.map((msg, i) => (
              <div key={i}>{msg}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Debug Page</h1>
      <p>
        <strong>Auth Ready:</strong> {ready ? 'Yes' : 'No'}
      </p>
      <p>
        <strong>User:</strong> {user ? `${user.email} (${user.uid})` : 'Not signed in'}
      </p>

      {!user && (
        <div style={{ marginTop: 20 }}>
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Signing in...' : 'DEBUG: Sign in with Google'}
          </button>
        </div>
      )}

      {user && (
        <div style={{ marginTop: 20 }}>
          <button
            onClick={() => {
              addDebug('Sign out clicked');
              if (auth) signOut(auth);
            }}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            Sign Out
          </button>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <h3>Debug Log:</h3>
        <div
          style={{
            backgroundColor: '#f5f5f5',
            padding: 10,
            fontFamily: 'monospace',
            fontSize: 12,
            maxHeight: 300,
            overflow: 'auto',
          }}
        >
          {debug.map((msg, i) => (
            <div key={i}>{msg}</div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button onClick={() => setDebug([])}>Clear Debug Log</button>
      </div>
    </div>
  );
}
