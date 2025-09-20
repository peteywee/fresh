'use client';

import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase.client';
import { signInWithGoogle, consumeRedirectResult } from '@/lib/auth-google';

type Check = { name: string; ok: boolean; note?: string };

function Mask(v?: string) {
  if (!v) return '—';
  return v.length > 8 ? v.slice(0, 4) + '…' + v.slice(-4) : v;
}

export default function AuthDebug() {
  const [user, setUser] = useState<any>(undefined);
  const [busy, setBusy] = useState(false);
  const [lastErr, setLastErr] = useState<string | null>(null);
  const [redirectConsumed, setRedirectConsumed] = useState(false);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    (async () => {
      const res = await consumeRedirectResult();
      if (res?.ok) setRedirectConsumed(true);
      if (res && !res.ok) setLastErr(res.error || 'redirect-error');
    })();
  }, []);

  const checks: Check[] = useMemo(() => {
    const c: Check[] = [];
    c.push({ name: 'NEXT_PUBLIC_FIREBASE_API_KEY', ok: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY, note: Mask(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) });
    c.push({ name: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', ok: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, note: String(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '—') });
    c.push({ name: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', ok: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, note: String(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '—') });
    c.push({ name: 'Window location origin', ok: !!globalThis?.location?.origin, note: String(globalThis?.location?.origin || '—') });
    c.push({ name: 'Redirect consumed?', ok: redirectConsumed, note: redirectConsumed ? 'yes' : 'no' });
    c.push({ name: 'Auth user', ok: !!user, note: user ? (user.email || user.uid) : 'null' });
    return c;
  }, [user, redirectConsumed]);

  async function google() {
    setBusy(true); setLastErr(null);
    const res = await signInWithGoogle();
    if (!res.ok && res.error !== 'redirecting') { setLastErr(res.error); setBusy(false); }
  }

  return (
    <main style={{ maxWidth: 820, margin: '3rem auto', padding: '1rem' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Auth Debug</h1>
      <p style={{ color: '#4b5563', marginBottom: 16 }}>
        Use this page to verify Firebase env, complete redirect flows, and test Google Sign-In.
      </p>

      <section style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:16, marginBottom:20 }}>
        <h2 style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>Checks</h2>
        <ul>
          {checks.map((c) => (
            <li key={c.name} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px dashed #eee' }}>
              <span>{c.name}</span>
              <span style={{ color: c.ok ? '#065f46' : '#b91c1c', fontWeight:700 }}>
                {c.ok ? 'OK' : 'MISSING'} {c.note ? `(${c.note})` : ''}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ display:'flex', gap:12, marginBottom:16 }}>
        <button onClick={google} disabled={busy} style={{ padding:'0.6rem 0.9rem', borderRadius:10, border:'1px solid #d1d5db', background:'#f9fafb' }}>
          {busy ? 'Connecting…' : 'Test Google Sign-In'}
        </button>
        <button onClick={() => signOut(auth)} style={{ padding:'0.6rem 0.9rem', borderRadius:10, border:'1px solid #d1d5db', background:'#fff' }}>
          Sign out
        </button>
        <a href="/login" style={{ padding:'0.6rem 0.9rem', borderRadius:10, border:'1px solid #d1d5db', background:'#fff', textDecoration:'none', color:'#111827' }}>Go to /login</a>
      </section>

      {lastErr && <p style={{ color:'#b91c1c' }}>Last error: <b>{lastErr}</b></p>}

      <section style={{ marginTop:24 }}>
        <p style={{ fontSize:13, color:'#6b7280' }}>
          If env are OK here but Google still fails, add your current origin from above to Firebase &gt; Auth &gt; Authorized domains.
        </p>
      </section>
    </main>
  );
}
