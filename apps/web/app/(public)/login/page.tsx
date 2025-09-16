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
    } catch (e: any) {
      console.error('Login error:', e);
      setError(e?.message || 'Login failed');
    } finally {
      setBusy(false);
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
