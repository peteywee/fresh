'use client';

import { useState } from 'react';

export default function HydrationTestPage() {
  const [count, setCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  // Check if we're client-side
  if (typeof window !== 'undefined' && !hydrated) {
    setHydrated(true);
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🔄 React Hydration Test</h1>

      <div style={{ marginBottom: 20 }}>
        <p>
          <strong>Hydrated:</strong> {hydrated ? 'YES ✅' : 'NO ❌'}
        </p>
        <p>
          <strong>Count:</strong> {count}
        </p>
        <p>
          <strong>Window exists:</strong> {typeof window !== 'undefined' ? 'YES' : 'NO'}
        </p>
      </div>

      <div>
        <button
          onClick={() => {
            console.log('Button clicked, incrementing count');
            setCount(count + 1);
          }}
          style={{
            padding: '15px 30px',
            fontSize: '18px',
            backgroundColor: hydrated ? '#22c55e' : '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Click me! ({count})
        </button>
      </div>

      <div style={{ marginTop: 20, fontSize: 14, color: '#666' }}>
        <p>If this button doesn't work, React hydration is failing.</p>
        <p>Button should be green when hydrated, red when not.</p>
      </div>
    </div>
  );
}
