'use client';

import { useEffect, useState } from 'react';

import { auth } from '@/lib/firebase.client';

export default function FirebaseTestPage() {
  const [tests, setTests] = useState<
    Array<{ name: string; status: 'pending' | 'pass' | 'fail'; details?: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  const addTest = (name: string, status: 'pending' | 'pass' | 'fail', details?: string) => {
    setTests(prev => [...prev.filter(t => t.name !== name), { name, status, details }]);
  };

  useEffect(() => {
    const runTests = async () => {
      // Test 1: Firebase Auth Import
      try {
        if (auth) {
          addTest('Firebase Auth Import', 'pass', `Auth instance created`);
        } else {
          addTest('Firebase Auth Import', 'fail', 'Auth instance is null/undefined');
        }
      } catch (err: any) {
        addTest('Firebase Auth Import', 'fail', err.message);
      }

      // Test 2: Firebase Config
      try {
        const config = auth.app.options;
        if (config.apiKey && config.authDomain && config.projectId) {
          addTest('Firebase Config', 'pass', `API Key: ${config.apiKey?.substring(0, 10)}...`);
        } else {
          addTest('Firebase Config', 'fail', 'Missing required config fields');
        }
      } catch (err: any) {
        addTest('Firebase Config', 'fail', err.message);
      }

      // Test 3: Google Auth Provider
      try {
        const { GoogleAuthProvider } = await import('firebase/auth');
        const provider = new GoogleAuthProvider();
        if (provider) {
          addTest('Google Auth Provider', 'pass', 'Provider created successfully');
        } else {
          addTest('Google Auth Provider', 'fail', 'Provider creation failed');
        }
      } catch (err: any) {
        addTest('Google Auth Provider', 'fail', err.message);
      }

      // Test 4: Auth State Ready
      try {
        await new Promise<void>(resolve => {
          const unsub = auth.onAuthStateChanged(() => {
            unsub();
            resolve();
          });
        });
        addTest('Auth State Listener', 'pass', 'Auth state listener working');
      } catch (err: any) {
        addTest('Auth State Listener', 'fail', err.message);
      }

      // Test 5: Environment Variables
      const requiredEnvs = [
        'NEXT_PUBLIC_FIREBASE_API_KEY',
        'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
        'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      ];

      const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
      if (missingEnvs.length === 0) {
        addTest('Environment Variables', 'pass', 'All required env vars present');
      } else {
        addTest('Environment Variables', 'fail', `Missing: ${missingEnvs.join(', ')}`);
      }

      // Test 6: Domain Check
      const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
      const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
      if (authDomain) {
        addTest('Domain Check', 'pass', `Current: ${currentDomain}, Auth: ${authDomain}`);
      } else {
        addTest('Domain Check', 'fail', 'No auth domain configured');
      }

      setLoading(false);
    };

    runTests();
  }, []);

  const testGooglePopup = async () => {
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      addTest('Google Popup Test', 'pending', 'Testing popup...');

      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        addTest('Google Popup Test', 'pass', `Signed in as: ${result.user.email}`);
      } else {
        addTest('Google Popup Test', 'fail', 'No user returned');
      }
    } catch (err: any) {
      addTest('Google Popup Test', 'fail', `Error: ${err.code || err.message}`);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'monospace' }}>
      <h1>🔥 Firebase & Google Auth Test Suite</h1>

      {loading && <p>Running tests...</p>}

      <div style={{ marginTop: 20 }}>
        {tests.map((test, i) => (
          <div
            key={i}
            style={{
              padding: 10,
              margin: '5px 0',
              backgroundColor:
                test.status === 'pass' ? '#d4edda' : test.status === 'fail' ? '#f8d7da' : '#fff3cd',
              border: `1px solid ${test.status === 'pass' ? '#c3e6cb' : test.status === 'fail' ? '#f5c6cb' : '#ffeaa7'}`,
              borderRadius: 4,
            }}
          >
            <div style={{ fontWeight: 'bold' }}>
              {test.status === 'pass' ? '✅' : test.status === 'fail' ? '❌' : '⏳'} {test.name}
            </div>
            {test.details && (
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{test.details}</div>
            )}
          </div>
        ))}
      </div>

      {!loading && (
        <div style={{ marginTop: 20 }}>
          <button
            onClick={testGooglePopup}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            🧪 Test Google Sign-In Popup
          </button>
        </div>
      )}
    </div>
  );
}
