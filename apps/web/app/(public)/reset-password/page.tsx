'use client';

import { Suspense, useEffect, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const t = params.get('token');
    if (t) setToken(t);
  }, [params]);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setMsg('');
    const r = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, newPassword: password }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      setMsg('Password reset. Redirecting to login...');
      setTimeout(() => router.push('/login'), 800);
    } else {
      setMsg(d.error ?? 'Reset failed');
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 420 }}>
      <h1>Reset Password</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <input placeholder="Token" value={token} onChange={e => setToken(e.target.value)} />
        <input
          placeholder="New password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button type="submit">Reset</button>
      </form>
      {msg && <p style={{ color: 'crimson', marginTop: 12 }}>{msg}</p>}
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
