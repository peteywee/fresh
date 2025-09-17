'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { onAuthStateChanged } from 'firebase/auth';

import { emailSignIn } from '@/lib/auth-email';
import { consumeRedirectResult, signInWithGoogle } from '@/lib/auth-google';
import { auth } from '@/lib/firebase.client';

import styles from '../auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Already signed in? bounce to home
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (u) router.replace('/');
    });
    return () => unsub();
  }, [router]);

  // Finish Google redirect, if any
  useEffect(() => {
    (async () => {
      const res = await consumeRedirectResult();
      if (res?.ok) router.replace('/');
    })();
  }, [router]);

  async function handleGoogle() {
    setErr(null);
    setBusy(true);
    const res = await signInWithGoogle();
    if (res.ok) router.replace('/dashboard');
    else if (res.error !== 'redirecting') {
      setErr(res.error);
      setBusy(false);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await emailSignIn(email, password);
      router.replace('/dashboard');
    } catch (e: any) {
      setErr(e?.code || 'auth/error');
      setBusy(false);
    }
  }

  return (
    <main className={styles.authMain}>
      <h1 className={styles.authTitle}>Sign in</h1>

      <form onSubmit={handleEmail} className={styles.authForm}>
        <label className={styles.authLabel}>
          <span>Email</span>
          <input
            className={styles.authInput}
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </label>
        <label className={styles.authLabel}>
          <span>Password</span>
          <input
            className={styles.authInput}
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
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
        disabled={busy}
        className={styles.authProviderButton}
        aria-busy={busy}
      >
        <span className="inline-flex items-center gap-2">
          <Image alt="Google" src="/icons/google.svg" width={20} height={20} />
          {busy ? 'Connecting…' : 'Sign in with Google'}
        </span>
      </button>

      {err && <p className={styles.authError}>{err}</p>}

      <div className={styles.authCtaRow}>
        <a href="/register" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14 }}>
          Create account
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
