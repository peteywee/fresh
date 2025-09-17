'use client';

import { useState } from 'react';

import { emailResetPassword } from '@/lib/auth-email';

import styles from '../auth.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await emailResetPassword(email);
      setSent(true);
    } catch (e: any) {
      setErr(e?.code || 'auth/reset-error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.authMain}>
      <h1 className={styles.authTitle}>Reset your password</h1>
      {sent ? (
        <p>
          Check <b>{email}</b> for a reset link. If you don't see it, check spam.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className={styles.authForm}>
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
          <button type="submit" disabled={busy} className={styles.authPrimaryButton}>
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
          {err && <p className={styles.authError}>{err}</p>}
        </form>
      )}
      <div className={styles.authCtaRow}>
        <a href="/login" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14 }}>
          Back to sign in
        </a>
      </div>
    </main>
  );
}
