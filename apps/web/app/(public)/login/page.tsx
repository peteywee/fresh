'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { emailSignIn } from '@/lib/auth-email';
import { consumeRedirectResult, signInWithGoogle } from '@/lib/auth-google';
import { auth } from '@/lib/firebase.client';

import styles from '../auth.module.css';

// Sync Firebase client auth with server session
async function syncServerSession() {
  try {
    console.log('[login] syncing server session');
    const user = auth.currentUser;
    if (!user) {
      console.log('[login] no current user for sync');
      throw new Error('No authenticated user');
    }

    // Force fresh token to avoid stale token issues
    console.log('[login] getting fresh ID token');
    const idToken = await user.getIdToken(true); // true = force refresh
    console.log('[login] got fresh ID token - length:', idToken.length);
    console.log('[login] token prefix:', idToken.substring(0, 100));
    console.log('[login] posting to /api/session/login');

    const response = await fetch('/api/session/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[login] server session sync failed:', response.status, errorText);
      throw new Error(`Server session sync failed: ${response.status} ${errorText}`);
    } else {
      console.log('[login] server session sync success');
    }
  } catch (error) {
    console.error('[login] error syncing server session:', error);
    throw error; // Re-throw to allow caller to handle
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Removed the onAuthStateChanged effect that could cause a race condition
  // by redirecting before server session sync completes
  // useEffect(() => {
  //   const unsub = onAuthStateChanged(auth, u => {
  //     if (u) router.replace('/dashboard');
  //   });
  //   return () => unsub();
  // }, [router]);

  // Consume redirect result on mount
  useEffect(() => {
    (async () => {
      console.log('[login] checking for redirect result');
      const res = await consumeRedirectResult();
      if (res && res.ok) {
        console.log('[login] redirect result ok, syncing server session');
        try {
          await syncServerSession();
          console.log('[login] redirecting to dashboard');
          router.replace('/dashboard');
        } catch (syncError) {
          console.error('[login] server session sync failed after redirect:', syncError);
          setErr('auth/session-sync-failed');
        }
      } else if (res && !res.ok) {
        console.log('[login] redirect result error:', res.error);
        setErr(res.error);
      }
    })();
  }, [router]);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      console.log('[login] attempting email login');
      await emailSignIn(email, password);
      console.log('[login] email login success, syncing server session');
      try {
        await syncServerSession();
        console.log('[login] redirecting to dashboard');
        router.replace('/dashboard');
      } catch (syncError) {
        console.error('[login] server session sync failed after email login:', syncError);
        setErr('auth/session-sync-failed');
      }
    } catch (e: any) {
      console.log('[login] email login error:', e?.code);
      setErr(e?.code || 'auth/login-error');
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleLogin() {
    setErr(null);
    setBusy(true);
    try {
      console.log('[login] attempting Google login');
      const result = await signInWithGoogle();
      if (result.ok) {
        console.log('[login] popup success, syncing server session');
        try {
          await syncServerSession();
          console.log('[login] redirecting to dashboard');
          router.replace('/dashboard');
        } catch (syncError) {
          console.error('[login] server session sync failed after Google login:', syncError);
          setErr('auth/session-sync-failed');
        }
      } else if (result.error !== 'redirecting') {
        console.log('[login] popup failed:', result.error);
        setErr(result.error);
      } else {
        console.log('[login] redirecting to Google...');
      }
      // If redirecting, don't show error - user will come back after redirect
    } catch (e: any) {
      console.log('[login] Google login exception:', e?.code);
      setErr(e?.code || 'auth/google-error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.authMain}>
      <h1 className={styles.authTitle}>Sign in to Fresh</h1>

      <form onSubmit={handleEmailLogin} className={styles.authForm}>
        <label className={styles.authLabel}>
          Email
          <input
            type="email"
            className={styles.authInput}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </label>

        <label className={styles.authLabel}>
          Password
          <input
            type="password"
            className={styles.authInput}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={busy} className={styles.authPrimaryButton}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>

        {err && <p className={styles.authError}>{err}</p>}
      </form>

      <div className={styles.authDivider}>or</div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={busy}
        className={styles.authProviderButton}
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Sign in with Google
      </button>

      <div className={styles.authCtaRow}>
        <Link href="/register">Don't have an account? Sign up</Link>
        <br />
        <Link href="/forgot-password">Forgot your password?</Link>
      </div>
    </main>
  );
}
