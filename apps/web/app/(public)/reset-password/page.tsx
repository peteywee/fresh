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
    <main style={{ padding: 24, maxWidth: 420, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          Reset Password
        </h1>
        <p style={{ color: '#6b7280', fontSize: 16 }}>Enter your new password</p>
      </div>

      <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
        {/* Hidden field for username context - helps password managers */}
        <input type="hidden" name="username" autoComplete="username" value="" />

        <div>
          <label
            htmlFor="token"
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
              marginBottom: 4,
            }}
          >
            Reset Token
          </label>
          <input
            id="token"
            name="token"
            placeholder="Token"
            type="text"
            value={token}
            onChange={e => setToken(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label
            htmlFor="new-password"
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
              marginBottom: 4,
            }}
          >
            New Password
          </label>
          <input
            id="new-password"
            name="password"
            placeholder="New password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '12px 24px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          Reset Password
        </button>
      </form>
      {msg && (
        <div
          style={{
            color: msg.includes('reset') ? '#059669' : '#dc2626',
            backgroundColor: msg.includes('reset') ? '#f0fdf4' : '#fef2f2',
            padding: '12px 16px',
            borderRadius: '8px',
            marginTop: '16px',
            border: msg.includes('reset') ? '1px solid #bbf7d0' : '1px solid #fecaca',
            fontSize: '14px',
          }}
        >
          {msg}
        </div>
      )}
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
