'use client';

import { useState } from 'react';

export default function SimpleTestPage() {
  const [message, setMessage] = useState('Initial state');

  const handleClick = () => {
    setMessage('Button clicked! JavaScript is working!');
    console.log('Button clicked!');
    alert('JavaScript is working!');
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Super Simple JavaScript Test</h1>
      <p>Current message: {message}</p>
      <button
        onClick={handleClick}
        style={{
          padding: '15px 30px',
          fontSize: '16px',
          backgroundColor: '#ff0000',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        CLICK ME - Test Basic JavaScript
      </button>

      <div style={{ marginTop: 20 }}>
        <p>Client-side check: {typeof window !== 'undefined' ? 'YES' : 'NO'}</p>
        <p>Time: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}
