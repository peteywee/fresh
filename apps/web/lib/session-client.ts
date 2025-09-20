'use client';

export async function createServerSession(idToken: string) {
  const res = await fetch('/api/session/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.error || 'session-login-failed') as any;
    err.code = data?.code || 'auth/error';
    throw err;
  }
  return data;
}

export async function logoutServerSession() {
  await fetch('/api/session/logout', { method: 'POST' });
}
