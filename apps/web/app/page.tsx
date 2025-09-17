'use client';

import { signOut } from 'firebase/auth';

import RequireAuth from '@/components/RequireAuth';
import { auth } from '@/lib/firebase.client';

export default function HomePage() {
  return (
    <RequireAuth>
      <main style={{ maxWidth: 720, margin: '4rem auto', padding: '0 1rem' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Welcome</h1>
        <p style={{ color: '#4b5563', marginBottom: 16 }}>
          You are signed in. This page is protected by a client guard for MVP speed.
        </p>
        <button
          onClick={() => signOut(auth)}
          style={{
            padding: '0.6rem 0.9rem',
            borderRadius: 10,
            border: '1px solid #d1d5db',
            background: '#fff',
          }}
        >
          Sign out
        </button>
      </main>
    </RequireAuth>
  );
}
