'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      // Dynamic import to reduce initial bundle size and improve performance
      const [{ auth }, { signInWithEmailAndPassword }] = await Promise.all([
        import('@/lib/firebase.client'),
        import('firebase/auth'),
      ]);

      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken(true);

      await exchangeFirebaseTokenForSession(idToken);
    } catch (e: any) {
      console.error('Login error:', e);
      setError(e?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    setBusy(true);
    setError(null);

    try {
      // Dynamic import to reduce initial bundle size and improve performance
      const [{ auth, googleProvider }, { signInWithPopup }] = await Promise.all([
        import('@/lib/firebase.client'),
        import('firebase/auth'),
      ]);

      const credential = await signInWithPopup(auth, googleProvider);
      const idToken = await credential.user.getIdToken(true);

      await exchangeFirebaseTokenForSession(idToken);
    } catch (e: any) {
      console.error('Google sign-in error:', e);
      setError(e?.message || 'Google sign-in failed');
    } finally {
      setBusy(false);
    }
  }

  async function exchangeFirebaseTokenForSession(idToken: string) {
    const response = await fetch('/api/session/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      throw new Error('Session exchange failed');
    }

    // Check current session status to determine redirect
    const statusResponse = await fetch('/api/session/current');
    const status = await statusResponse.json();

    if (status.user?.onboardingComplete) {
      // Use window.location to ensure middleware processes the new cookies
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/onboarding';
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: '0 auto', padding: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          Welcome Back
        </h1>
        <p style={{ color: '#6b7280', fontSize: 16 }}>Sign in to your Fresh account</p>
      </div>

      <form onSubmit={handleLogin} style={{ display: 'grid', gap: 16 }}>
        <div>
          <label
            htmlFor="email"
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
              marginBottom: 4,
            }}
            suppressHydrationWarning
          >
            Email Address
          </label>
          <input
            id="email"
            name="email"
            placeholder="Enter your email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={busy}
            suppressHydrationWarning
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              backgroundColor: busy ? '#f9fafb' : 'white',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label
            htmlFor="current-password"
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
              marginBottom: 4,
            }}
            suppressHydrationWarning
          >
            Password
          </label>
          <input
            id="current-password"
            name="password"
            placeholder="Enter your password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={busy}
            suppressHydrationWarning
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              backgroundColor: busy ? '#f9fafb' : 'white',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          disabled={busy || !email || !password}
          type="submit"
          style={{
            width: '100%',
            padding: '12px 24px',
            backgroundColor: busy || !email || !password ? '#9ca3af' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: busy || !email || !password ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          {busy ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div style={{ margin: '24px 0', textAlign: 'center' }}>
        <div style={{ position: 'relative' }}>
          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: 0 }} />
          <span
            style={{
              position: 'absolute',
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'white',
              padding: '0 16px',
              fontSize: '14px',
              color: '#6b7280',
            }}
          >
            or
          </span>
        </div>
      </div>

      <button
        onClick={handleGoogleSignIn}
        disabled={busy}
        type="button"
        style={{
          width: '100%',
          padding: '12px 24px',
          backgroundColor: 'white',
          color: '#374151',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: busy ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
        }}
        onMouseEnter={e => {
          if (!busy) {
            e.currentTarget.style.backgroundColor = '#f9fafb';
            e.currentTarget.style.borderColor = '#9ca3af';
          }
        }}
        onMouseLeave={e => {
          if (!busy) {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.borderColor = '#d1d5db';
          }
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {busy ? 'Signing in...' : 'Continue with Google'}
      </button>

      <div
        style={{
          textAlign: 'center',
          marginTop: 24,
          display: 'flex',
          gap: 16,
          justifyContent: 'center',
        }}
      >
        <a href="/register" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14 }}>
          Create Account
        </a>
        <span style={{ color: '#d1d5db' }}>•</span>
        <a
          href="/forgot-password"
          style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14 }}
        >
          Forgot Password
        </a>
      </div>

      {error && (
        <div
          style={{
            color: '#dc2626',
            backgroundColor: '#fef2f2',
            padding: '12px 16px',
            borderRadius: '8px',
            marginTop: '16px',
            border: '1px solid #fecaca',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}
    </main>
  );
}
