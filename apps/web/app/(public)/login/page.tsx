'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { signInWithEmail } from '@/lib/auth-email';
import { consumeRedirectResult, signInWithGoogle } from '@/lib/auth-google';
import { logOAuthDebugInfo } from '@/lib/oauth-debug';

import styles from '../auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [envOK, setEnvOK] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await consumeRedirectResult();
        if (res?.ok && mounted) {
          // Get the ID token and exchange it for a session
          const idToken = await res.cred.user.getIdToken();

          const response = await fetch('/api/session/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });

          if (response.ok) {
            router.replace('/');
          } else {
            const error = await response.json().catch(() => ({ error: 'Login failed' }));
            setErr(error.error || 'Login failed after redirect');
          }
        }
      } catch (error) {
        console.error('Redirect result error:', error);
        if (mounted) {
          setErr('Authentication failed');
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    import('@/lib/firebase.client').then(m => setEnvOK(!!m.app)).catch(() => setEnvOK(false));
  }, []);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);

    const result = await signInWithEmail(email, password);

    if (result.ok) {
      router.replace('/');
    } else {
      setErr(result.error);
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setErr(null);
    setBusy(true);

    try {
      const res = await signInWithGoogle();

      if (res.ok) {
        // Get the ID token and exchange it for a session
        const idToken = await res.cred.user.getIdToken();

        const response = await fetch('/api/session/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });

        if (response.ok) {
          router.replace('/');
        } else {
          const error = await response.json().catch(() => ({ error: 'Login failed' }));
          setErr(error.error || 'Login failed');
          setBusy(false);
        }
      } else if (res.error !== 'redirecting') {
        console.error('Google sign-in error code:', res.error);

        // Log debug information for development
        if (process.env.NODE_ENV === 'development') {
          logOAuthDebugInfo();
        }

        // Show specific error messages for common Google auth errors
        let errorMessage = 'Google sign-in failed';
        switch (res.error) {
          case 'auth/internal-error':
            errorMessage =
              'Google OAuth configuration issue. This happens in development environments. Please configure the OAuth client in Google Cloud Console to allow this domain.';
            break;
          case 'auth/popup-blocked':
            errorMessage = 'Popup was blocked. Please allow popups and try again.';
            break;
          case 'auth/cancelled-popup-request':
            errorMessage = 'Sign-in was cancelled. Please try again.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection and try again.';
            break;
          case 'auth/unauthorized-domain':
            errorMessage =
              'This domain is not authorized for Google sign-in. Please contact the administrator.';
            break;
          default:
            errorMessage = `Google sign-in failed: ${res.error}`;
        }
        setErr(errorMessage);
        setBusy(false);
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);

      let errorMessage = 'Google sign-in failed. Please try again.';
      if (error?.code) {
        switch (error.code) {
          case 'auth/internal-error':
            errorMessage =
              'Google authentication internal error. This may be due to configuration issues.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many attempts. Please wait and try again.';
            break;
          default:
            errorMessage = `Google sign-in error: ${error.code}`;
        }
      }

      setErr(errorMessage);
      setBusy(false);
    }
  }

  return (
    <main className={styles.authMain}>
      <h1 className={styles.authTitle}>Sign in</h1>

      <form onSubmit={handleEmailLogin} className={styles.authForm}>
        <label className={styles.authLabel}>
          <span>Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={styles.authInput}
          />
        </label>

        <label className={styles.authLabel}>
          <span>Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={styles.authInput}
          />
        </label>

        <button type="submit" disabled={busy} className={styles.authPrimaryButton}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className={styles.authDivider}>
        <span>or</span>
      </div>

      <button
        onClick={handleGoogle}
        disabled={busy || !envOK}
        className={styles.authProviderButton}
        aria-disabled={busy || !envOK}
        aria-busy={busy}
      >
        <span className="inline-flex items-center gap-2">
          <Image alt="Google" src="/icons/google.svg" width={20} height={20} />
          {busy ? 'Signing in…' : 'Sign in with Google'}
        </span>
      </button>

      {!envOK && (
        <p className={styles.authError}>
          Missing Firebase env. Fill <code>apps/web/.env.local</code> and restart the dev server.
        </p>
      )}

      {err && <p className={styles.authError}>{err}</p>}

      <div className={styles.authCtaRow}>
        <a href="/register" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14 }}>
          New here? Create an account
        </a>
        <a
          href="/forgot-password"
          style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14 }}
        >
          Forgot password?
        </a>
      </div>
    </main>
  );
}
