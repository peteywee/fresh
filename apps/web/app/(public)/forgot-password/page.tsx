'use client';

import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      // Dynamic import to reduce initial bundle size
      const [{ auth }, { sendPasswordResetEmail }] = await Promise.all([
        import('@/lib/firebase.client'),
        import('firebase/auth'),
      ]);

      await sendPasswordResetEmail(auth, email);
      setMessage(
        'If an account exists for that email, a password reset link has been sent. Please check your email.'
      );
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        setMessage(
          'If an account exists for that email, a password reset link has been sent. Please check your email.'
        );
      } else if (e.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(e?.message || 'Password reset failed');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 420, margin: '0 auto' }}>
      <h1>Reset Your Password</h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <form onSubmit={handleReset} style={{ display: 'grid', gap: 12 }}>
        <label
          htmlFor="email"
          style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}
          suppressHydrationWarning
        >
          Email Address
        </label>
        <input
          id="email"
          name="email"
          placeholder="Email address"
          type="email"
          autoComplete="username"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={busy}
          suppressHydrationWarning
          style={{
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '1rem',
          }}
        />
        <button
          disabled={busy || !email}
          type="submit"
          style={{
            padding: '0.75rem',
            backgroundColor: busy ? '#9ca3af' : '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          {busy ? 'Sending Reset Link...' : 'Send Reset Link'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <span style={{ color: '#64748b' }}>Remember your password? </span>
        <a href="/" style={{ color: '#3b82f6', textDecoration: 'none' }}>
          Sign in here
        </a>
      </div>

      {message && (
        <p
          style={{
            color: '#059669',
            marginTop: '1rem',
            textAlign: 'center',
            padding: '0.75rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '6px',
          }}
        >
          {message}
        </p>
      )}

      {error && (
        <p
          style={{
            color: '#ef4444',
            marginTop: '1rem',
            textAlign: 'center',
            padding: '0.75rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
          }}
        >
          {error}
        </p>
      )}
    </main>
  );
}
