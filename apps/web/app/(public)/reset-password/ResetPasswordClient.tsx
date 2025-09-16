'use client';

import React, { useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPasswordClient() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  async function doReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      setBusy(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      setBusy(false);
      return;
    }

    const r = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      router.push('/login');
    } else {
      setMessage('Reset failed: ' + (d.error ?? 'unknown'));
    }
    setBusy(false);
  }

  return (
    <main style={{ maxWidth: 420, margin: '0 auto', padding: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          Reset Password
        </h1>
        <p style={{ color: '#6b7280', fontSize: 16 }}>Enter your new password</p>
      </div>

      <form onSubmit={doReset} style={{ display: 'grid', gap: 16 }}>
        {/* Hidden field for username context - helps password managers */}
        <input type="hidden" name="username" autoComplete="username" value="" />
        
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
            type="password"
            placeholder="Enter new password (min 6 characters)"
            autoComplete="new-password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            minLength={6}
            disabled={busy}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              backgroundColor: busy ? '#f9fafb' : 'white',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label
            htmlFor="confirm-new-password"
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
              marginBottom: 4,
            }}
          >
            Confirm New Password
          </label>
          <input
            id="confirm-new-password"
            name="confirmPassword"
            type="password"
            placeholder="Confirm your new password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            disabled={busy}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              backgroundColor: busy ? '#f9fafb' : 'white',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={busy || !newPassword || newPassword !== confirmPassword}
          style={{
            width: '100%',
            padding: '12px 24px',
            backgroundColor: busy || !newPassword || newPassword !== confirmPassword ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: busy || !newPassword || newPassword !== confirmPassword ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          {busy ? 'Resetting Password...' : 'Reset Password'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button
          onClick={() => router.push('/login')}
          style={{
            background: 'none',
            border: 'none',
            color: '#2563eb',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Back to Login
        </button>
      </div>

      {message && (
        <div
          style={{
            color: '#dc2626',
            backgroundColor: '#fef2f2',
            padding: '12px 16px',
            borderRadius: '8px',
            marginTop: '16px',
            border: '1px solid #fecaca',
            fontSize: '14px',
          }}
        >
          {message}
        </div>
      )}
    </main>
  );
}
