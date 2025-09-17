'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import styles from '../auth.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exchangeFirebaseTokenForSession(idToken: string) {
    const res = await fetch('/api/session/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) throw new Error('Session exchange failed');
    router.replace('/onboarding');
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setBusy(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setBusy(false);
      return;
    }
    try {
      const [{ auth }, { createUserWithEmailAndPassword, updateProfile }] = await Promise.all([
        import('@/lib/firebase.client'),
        import('firebase/auth'),
      ]);
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) await updateProfile(user, { displayName });
      const idToken = await user.getIdToken(true);
      await exchangeFirebaseTokenForSession(idToken);
    } catch (e: any) {
      if (e?.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Try signing in instead.');
      } else if (e?.code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger password.');
      } else if (e?.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(e?.message || 'Registration failed');
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    setBusy(true);
    setError(null);
    try {
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

  return (
    <main className={styles.authMain}>
      <div className={styles.authTitle}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          Create Your Account
        </h1>
        <p style={{ color: '#6b7280', fontSize: 16 }}>
          Join Fresh to get started with your team workspace
        </p>
      </div>

      <form onSubmit={handleRegister} style={{ display: 'grid', gap: 16 }}>
        <div>
          <label
            htmlFor="name"
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
              marginBottom: 4,
            }}
          >
            Full Name
          </label>
          <input
            id="name"
            name="name"
            placeholder="Enter your full name"
            type="text"
            autoComplete="name"
            onChange={e => setDisplayName(e.target.value)}
            required
            disabled={busy}
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
            htmlFor="email"
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
              marginBottom: 4,
            }}
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
            htmlFor="new-password"
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
              marginBottom: 4,
            }}
          >
            Password
          </label>
          <input
            id="new-password"
            name="password"
            placeholder="Create a password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={busy}
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
            htmlFor="confirm-password"
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
              marginBottom: 4,
            }}
          >
            Confirm Password
          </label>
          <input
            id="confirm-password"
            name="confirm-password"
            placeholder="Re-enter your password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            disabled={busy}
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
          disabled={busy || !email || !password || !confirmPassword}
          type="submit"
          style={{
            width: '100%',
            padding: '12px 24px',
            backgroundColor:
              busy || !email || !password || !confirmPassword ? '#9ca3af' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: busy || !email || !password || !confirmPassword ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          {busy ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div className={styles.authDivider}>
        <div className={styles.authDividerLabel}>or</div>
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

      <div className={styles.authCtaRow}>
        <a href="/login" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14 }}>
          Already have an account? Sign in
        </a>
      </div>

      {error && <div className={styles.authError}>{error}</div>}
    </main>
  );
}
