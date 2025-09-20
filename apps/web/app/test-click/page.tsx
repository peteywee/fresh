'use client';

import { useState } from 'react';

export default function ClickTestPage() {
  const [clickCount, setClickCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[${timestamp}] ${message}`);
  };

  const handleBasicClick = () => {
    addLog('Basic button clicked!');
    setClickCount(prev => prev + 1);
  };

  const handleFirebaseTest = async () => {
    addLog('Firebase test button clicked...');

    try {
      // Test 1: Can we import Firebase?
      addLog('Testing Firebase imports...');
      const { auth } = await import('@/lib/firebase.client');
      addLog('✅ Firebase client imported successfully');

      // Test 2: Is auth object valid?
      if (auth) {
        addLog('✅ Auth object exists');
        addLog(`Auth app name: ${auth.app.name}`);
      } else {
        addLog('❌ Auth object is null/undefined');
      }

      // Test 3: Can we import Google provider?
      const { GoogleAuthProvider } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      addLog('✅ GoogleAuthProvider created');

      // Test 4: Can we call signInWithPopup?
      const { signInWithPopup } = await import('firebase/auth');
      addLog('✅ signInWithPopup imported');

      addLog('🚀 About to call signInWithPopup...');
      if (!auth) throw new Error('Firebase auth not initialized');
      const result = await signInWithPopup(auth, provider);
      addLog(`✅ Sign-in successful: ${result.user.email}`);
    } catch (error: any) {
      addLog(`❌ Error: ${error.code || 'unknown'} - ${error.message}`);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'monospace' }}>
      <h1>🧪 JavaScript & Firebase Click Test</h1>

      <div style={{ marginBottom: 20 }}>
        <h3>Basic JavaScript Test</h3>
        <button
          onClick={handleBasicClick}
          style={{
            padding: '8px 16px',
            margin: '5px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Click Me (Count: {clickCount})
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h3>Firebase Authentication Test</h3>
        <button
          onClick={handleFirebaseTest}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Test Firebase Google Sign-In
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Debug Log:</h3>
        <div
          style={{
            backgroundColor: '#f5f5f5',
            padding: 15,
            borderRadius: 8,
            maxHeight: 300,
            overflow: 'auto',
            fontSize: 12,
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: '#666' }}>No logs yet. Click a button to test...</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} style={{ marginBottom: 2 }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button
          onClick={() => setLogs([])}
          style={{
            padding: '6px 12px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Clear Logs
        </button>
      </div>

      <div style={{ marginTop: 20, fontSize: 12, color: '#666' }}>
        <p>
          <strong>Environment Check:</strong>
        </p>
        <p>• Client-side: {typeof window !== 'undefined' ? 'Yes' : 'No'}</p>
        <p>• Location: {typeof window !== 'undefined' ? window.location.href : 'Server'}</p>
        <p>
          • User Agent:{' '}
          {typeof window !== 'undefined'
            ? window.navigator.userAgent.substring(0, 50) + '...'
            : 'Server'}
        </p>
      </div>
    </div>
  );
}
