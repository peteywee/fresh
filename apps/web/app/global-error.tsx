'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error details to console and potentially to an error reporting service
    console.error('Global Error Boundary caught:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    // You could also send this to an error tracking service like Sentry
    // Example: Sentry.captureException(error)
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            maxWidth: '600px',
            margin: '0 auto',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <h1 style={{ fontSize: '48px', margin: '0 0 16px', fontWeight: 800, color: '#dc2626' }}>
            500
          </h1>
          <h2 style={{ fontSize: '24px', margin: '0 0 16px', fontWeight: 600, color: '#374151' }}>
            Internal Server Error
          </h2>
          <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '24px' }}>
            Something went wrong on our end. We've been notified and are working to fix it.
          </p>
          <details
            style={{
              marginBottom: '24px',
              textAlign: 'left',
              background: '#f3f4f6',
              padding: '16px',
              borderRadius: '8px',
            }}
          >
            <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: '8px' }}>
              Error Details (for developers)
            </summary>
            <pre style={{ fontSize: '12px', overflow: 'auto', margin: 0 }}>
              Message: {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
              {error.stack && `\nStack: ${error.stack}`}
            </pre>
          </details>
          <button
            onClick={() => reset()}
            style={{
              display: 'inline-block',
              padding: '10px 18px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              marginRight: '12px',
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              display: 'inline-block',
              padding: '10px 18px',
              background: '#6b7280',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Go Home
          </a>
        </div>
      </body>
    </html>
  );
}
