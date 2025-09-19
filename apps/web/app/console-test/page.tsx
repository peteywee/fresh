'use client';

import { useEffect, useState } from 'react';

export default function ConsoleTestPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('Component mounted');

    // Override console.log to capture logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const captureLog = (level: string, ...args: any[]) => {
      const message = `[${level}] ${args.join(' ')}`;
      setLogs(prev => [...prev, message]);
      if (level === 'LOG') originalLog(...args);
      if (level === 'ERROR') originalError(...args);
      if (level === 'WARN') originalWarn(...args);
    };

    console.log = (...args) => captureLog('LOG', ...args);
    console.error = (...args) => captureLog('ERROR', ...args);
    console.warn = (...args) => captureLog('WARN', ...args);

    // Test console logging
    console.log('Console override working');

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const testClick = () => {
    console.log('Test button clicked');
    setLogs(prev => [...prev, 'Button click handled by React']);
  };

  const testError = () => {
    console.error('Test error message');
    throw new Error('Test error for debugging');
  };

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🖥️ Console & Error Test</h1>

      <div style={{ marginBottom: 20 }}>
        <button
          onClick={testClick}
          style={{
            marginRight: 10,
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 4,
          }}
        >
          Test Click
        </button>
        <button
          onClick={testError}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: 4,
          }}
        >
          Test Error
        </button>
      </div>

      <div>
        <h3>Console Logs:</h3>
        <div
          style={{
            backgroundColor: '#f3f4f6',
            padding: 15,
            borderRadius: 8,
            maxHeight: 300,
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: 12,
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: '#6b7280' }}>No logs captured yet...</div>
          ) : (
            logs.map((log, i) => (
              <div
                key={i}
                style={{ marginBottom: 4, color: log.includes('ERROR') ? '#dc2626' : '#374151' }}
              >
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
