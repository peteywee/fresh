'use client';

import { useState } from 'react';

export default function FirebaseImportTestPage() {
  const [result, setResult] = useState<string>('Not tested yet');
  const [loading, setLoading] = useState(false);

  const testBasicClick = () => {
    setResult('Basic React click works!');
  };

  const testFirebaseImport = async () => {
    setLoading(true);
    try {
      setResult('Attempting Firebase import...');

      // Dynamic import to avoid SSR issues
      const { auth } = await import('@/lib/firebase.client');
      setResult(`Firebase imported successfully! Auth: ${auth ? 'exists' : 'null'}`);
    } catch (error: any) {
      setResult(`Firebase import failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testGoogleAuth = async () => {
    setLoading(true);
    try {
      setResult('Attempting Google auth import...');

      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase.client');

      const provider = new GoogleAuthProvider();
      setResult('About to call signInWithPopup...');

      const result = await signInWithPopup(auth, provider);
      setResult(`Sign-in successful: ${result.user.email}`);
    } catch (error: any) {
      setResult(`Google auth failed: ${error.code || 'unknown'} - ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🔥 Firebase Import Test</h1>

      <div style={{ marginBottom: 20 }}>
        <p>
          <strong>Status:</strong> {result}
        </p>
        {loading && <p style={{ color: '#f59e0b' }}>⏳ Loading...</p>}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: 20 }}>
        <button
          onClick={testBasicClick}
          style={{
            padding: '8px 16px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: 4,
          }}
        >
          Test Basic Click
        </button>

        <button
          onClick={testFirebaseImport}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            opacity: loading ? 0.5 : 1,
          }}
        >
          Test Firebase Import
        </button>

        <button
          onClick={testGoogleAuth}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            opacity: loading ? 0.5 : 1,
          }}
        >
          Test Google Auth
        </button>
      </div>

      <div style={{ fontSize: 12, color: '#6b7280' }}>
        <p>This test helps isolate if the issue is with React hydration or Firebase imports.</p>
        <p>• First button: Tests basic React state management</p>
        <p>• Second button: Tests Firebase client import</p>
        <p>• Third button: Tests actual Google authentication</p>
      </div>
    </div>
  );
}
