'use client';

import { useState } from 'react';

import Image from 'next/image';

import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth';

import { app } from '@/lib/firebase.client';

export default function LoginPage() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function signInGoogle() {
    setErr(null);
    setBusy(true);
    try {
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // navigate as needed
      window.location.href = '/';
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  // Render the button only if env is present (prevents "missing env" silent failures)
  const envOK =
    !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-xl font-semibold mb-4">Login</h1>

      <button
        onClick={signInGoogle}
        disabled={!envOK || busy}
        className="w-full mb-3 rounded-xl border px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
        aria-disabled={!envOK || busy}
      >
        <span className="inline-flex items-center gap-2">
          <Image alt="Google" src="/icons/google.svg" width={20} height={20} />
          {busy ? 'Signing in…' : 'Sign in with Google'}
        </span>
      </button>

      {!envOK && (
        <p className="text-sm text-red-600">
          Missing Firebase env. Fill apps/web/.env.local and restart dev server.
        </p>
      )}
      {err && <p className="text-sm text-red-600">{err}</p>}
    </main>
  );
}
