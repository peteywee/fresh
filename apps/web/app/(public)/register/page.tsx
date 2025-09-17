'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { consumeRedirectResult, signInWithGoogle } from '@/lib/auth-google';

import styles from '../auth.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [envOK, setEnvOK] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await consumeRedirectResult();
      if (res?.ok) router.replace('/');
    })();
  }, [router]);

  useEffect(() => {
    import('@/lib/firebase.client').then(m => setEnvOK(!!m.app)).catch(() => setEnvOK(false));
  }, []);

  async function submitEmailPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      setBusy(true);
      const r = await fetch('/api/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      });
      if (!r.ok) throw new Error(`register_failed_${r.status}`);
      router.push('/login');
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    const res = await signInWithGoogle();
    if (res.ok) {
      router.replace('/');
    } else if (res.error !== 'redirecting') {
      setError(res.error);
      setBusy(false);
    }
  }

  return (
    <main className={styles.authMain}>
      <h1 className={styles.authTitle}>Create your account</h1>

      <form onSubmit={submitEmailPassword} className={styles.authForm}>
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
          <span>Display name</span>
          <input
            type="text"
            required
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
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

        <label className={styles.authLabel}>
          <span>Confirm password</span>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className={styles.authInput}
          />
        </label>

        <button type="submit" disabled={busy} className={styles.authPrimaryButton}>
          {busy ? 'Creating…' : 'Create account'}
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
          {busy ? 'Signing in…' : 'Continue with Google'}
        </span>
      </button>

      {!envOK && (
        <p className={styles.authError}>
          Missing Firebase env. Fill <code>apps/web/.env.local</code> and restart the dev server.
        </p>
      )}

      <div className={styles.authCtaRow}>
        <a href="/login" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14 }}>
          Already have an account? Sign in
        </a>
      </div>

      {error && <div className={styles.authError}>{error}</div>}
    </main>
  );
}
