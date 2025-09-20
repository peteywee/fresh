'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase.client';
import { signInWithGoogle, consumeRedirectResult } from '@/lib/auth-google';
import styles from '../auth.module.css';

// Sync Firebase client auth with server session
async function syncServerSession() {
  try {
    console.log('[login] syncing server session');
    if (!auth) {
      console.log('[login] Firebase auth not initialized');
      throw new Error('Firebase auth not initialized');
    }
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { if (u) router.replace('/'); });
    return () => unsub();
  }, [router]);

  useEffect(() => { (async () => { const res = await consumeRedirectResult(); if (res?.ok) router.replace('/'); })(); }, [router]);

  async function handleGoogle() {
    setErr(null); setBusy(true);
    const res = await signInWithGoogle();
    if (res.ok) router.replace('/');
    else if (res.error !== 'redirecting') { setErr(res.error); setBusy(false); }
  }

  return (
    <main className={styles.authMain}>
      <h1 className={styles.authTitle}>Sign in</h1>
      <button onClick={handleGoogle} disabled={busy} className={styles.authProviderButton} aria-busy={busy}>
        <span className="inline-flex items-center gap-2">
          <Image alt="Google" src="/icons/google.svg" width={20} height={20} />
          {busy ? 'Connecting…' : 'Sign in with Google'}
        </span>
      </button>
      {err && <p className={styles.authError}>{err}</p>}
      <div className={styles.authCtaRow}>
        <a href="/register" style={{ color:'#2563eb', textDecoration:'none', fontSize:14 }}>Create account</a>
        <a href="/forgot-password" style={{ color:'#2563eb', textDecoration:'none', fontSize:14 }}>Forgot password?</a>
      </div>
    </main>
  );
}
