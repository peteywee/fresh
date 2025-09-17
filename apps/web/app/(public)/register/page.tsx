'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { onAuthStateChanged, updateProfile } from 'firebase/auth';

import { emailRegister } from '@/lib/auth-email';
import { consumeRedirectResult, signInWithGoogle } from '@/lib/auth-google';
import { auth } from '@/lib/firebase.client';

import styles from '../auth.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // If already signed in, go home
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
    if (res.ok) router.replace('/');
    else if (res.error !== 'redirecting') {
      setErr(res.error);
      setBusy(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password !== confirm) {
      setErr('Passwords do not match');
      return;
    }
    try {
      setBusy(true);
      const cred = await emailRegister(email, password);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
      router.replace('/');
    } catch (e: any) {
      setErr(e?.code || 'auth/register-error');
      setBusy(false);
    }
  }

  return (
    <main className={styles.authMain}>
      <h1 className={styles.authTitle}>Create account</h1>

      <form onSubmit={handleRegister} className={styles.authForm}>
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
          <span>Display name (optional)</span>
          <input
            className={styles.authInput}
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
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
        <label className={styles.authLabel}>
          <span>Confirm password</span>
          <input
            className={styles.authInput}
            type="password"
            required
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
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
        disabled={busy}
        className={styles.authProviderButton}
        aria-busy={busy}
      >
        <span className="inline-flex items-center gap-2">
          <Image alt="Google" src="/icons/google.svg" width={20} height={20} />
          {busy ? 'Connecting…' : 'Continue with Google'}
        </span>
      </button>

      {err && <p className={styles.authError}>{err}</p>}

      <div className={styles.authCtaRow}>
        <a href="/login" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14 }}>
          Have an account? Sign in
        </a>
      </div>
    </main>
  );
}
