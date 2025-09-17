'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { consumeRedirectResult, signInWithGoogle } from '@/lib/auth-google';

import styles from '../auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [envOK, setEnvOK] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await consumeRedirectResult();
        if (res?.ok && mounted) {
          router.replace('/');
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    import('@/lib/firebase.client').then(m => setEnvOK(!!m.app)).catch(() => setEnvOK(false));
  }, []);

  async function handleGoogle() {
    setErr(null);
    setBusy(true);
    const res = await signInWithGoogle();
    if (res.ok) {
      router.replace('/');
    } else if (res.error !== 'redirecting') {
      setErr(res.error);
      setBusy(false);
    }
  }

  return (
    <main className={styles.authMain}>
      <h1 className={styles.authTitle}>Sign in</h1>

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
