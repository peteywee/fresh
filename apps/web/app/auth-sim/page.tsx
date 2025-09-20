'use client';

import { useEffect, useState } from 'react';

import { onAuthStateChanged, signOut } from 'firebase/auth';

import { emailRegister, emailResetPassword, emailSignIn } from '@/lib/auth-email';
import { consumeRedirectResult, signInWithGoogle } from '@/lib/auth-google';
import { auth } from '@/lib/firebase.client';
import { createServerSession, logoutServerSession } from '@/lib/session-client';

export default function AuthSim() {
  const [user, setUser] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [idToken, setIdToken] = useState<string | null>(null);
  const [serverMsg, setServerMsg] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);
  useEffect(() => {
    (async () => {
      await consumeRedirectResult();
    })();
  }, []);

  async function refreshIdToken() {
    const token = await auth.currentUser?.getIdToken(true);
    setIdToken(token ?? null);
  }

  async function google() {
    setBusy(true);
    setErr(null);
    const res = await signInWithGoogle();
    if (!res.ok && res.error !== 'redirecting') {
      setErr(res.error);
    }
    setBusy(false);
  }

  async function doEmailSignIn() {
    try {
      setBusy(true);
      setErr(null);
      await emailSignIn(email, pw);
    } catch (e: any) {
      setErr(e?.code || e?.message || 'email-signin-failed');
    } finally {
      setBusy(false);
    }
  }

  async function doEmailRegister() {
    try {
      setBusy(true);
      setErr(null);
      await emailRegister(email, pw);
    } catch (e: any) {
      setErr(e?.code || e?.message || 'email-register-failed');
    } finally {
      setBusy(false);
    }
  }

  async function doReset() {
    try {
      setBusy(true);
      setErr(null);
      await emailResetPassword(email);
      setServerMsg('Reset email sent');
    } catch (e: any) {
      setErr(e?.code || e?.message || 'email-reset-failed');
    } finally {
      setBusy(false);
    }
  }

  async function setSession() {
    try {
      setBusy(true);
      setErr(null);
      setServerMsg(null);
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) throw new Error('No client user / idToken');
      await createServerSession(token);
      setServerMsg('Server session cookie set ✅');
    } catch (e: any) {
      setErr(`Server session failed: ${e?.code || ''} ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  async function clearSession() {
    await logoutServerSession();
    setServerMsg('Server session cookie cleared');
  }

  return (
    <main style={{ maxWidth: 900, margin: '2rem auto', padding: 16 }}>
      <h1 style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Auth Simulator</h1>
      <p style={{ color: '#4b5563', marginBottom: 16 }}>
        Use this page to test Google & Email auth, fetch the Firebase ID token, and exchange it for
        a server session cookie.
      </p>

      <section
        style={{
          display: 'grid',
          gap: 10,
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <b>Client user:</b> {user ? user.email || user.uid : 'null'}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={google}
            disabled={busy}
            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}
          >
            Continue with Google
          </button>
          <input
            placeholder="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 8 }}
          />
          <input
            placeholder="password"
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 8 }}
          />
          <button
            onClick={doEmailSignIn}
            disabled={busy}
            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}
          >
            Email Sign In
          </button>
          <button
            onClick={doEmailRegister}
            disabled={busy}
            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}
          >
            Email Register
          </button>
          <button
            onClick={doReset}
            disabled={busy}
            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}
          >
            Send Reset
          </button>
          <button
            onClick={() => signOut(auth)}
            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}
          >
            Sign out (client)
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={refreshIdToken}
            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}
          >
            Fetch ID token
          </button>
          <button
            onClick={setSession}
            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}
          >
            Set server session
          </button>
          <button
            onClick={clearSession}
            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}
          >
            Clear session
          </button>
        </div>
        <div>
          <b>ID token:</b>{' '}
          <code style={{ fontSize: 12 }}>
            {idToken ? idToken.slice(0, 24) + '…' + idToken.slice(-24) : '—'}
          </code>
        </div>
        {err && (
          <div style={{ color: '#b91c1c' }}>
            <b>Error:</b> {err}
          </div>
        )}
        {serverMsg && <div style={{ color: '#065f46' }}>{serverMsg}</div>}
      </section>

      <p style={{ fontSize: 13, color: '#6b7280' }}>
        If session exchange fails with a "JWT" error, check your Firebase Admin environment
        variables.
      </p>
    </main>
  );
}
