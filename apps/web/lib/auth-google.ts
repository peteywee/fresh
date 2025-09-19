'use client';

import {
  GoogleAuthProvider,
  type UserCredential,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';

import { auth } from '@/lib/firebase.client';

export type GoogleSignInResult = { ok: true; cred: UserCredential } | { ok: false; error: string };

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });
provider.addScope('email');
provider.addScope('profile');

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  try {
    console.log('[google] attempting popup sign-in');
    const cred = await signInWithPopup(auth, provider);
    console.log('[google] popup success:', cred.user.email);
    return { ok: true, cred };
  } catch (err: any) {
    const code = err?.code || '';
    const message = err?.message || '';
    console.log('[google] popup error:', { code, message });

    // Treat auth/internal-error like a popup blocker - this is Firebase's catch-all
    // for various popup issues including third-party cookies, wrong authDomain, etc.
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/operation-not-supported-in-this-environment' ||
      code === 'auth/internal-error'
    ) {
      try {
        console.log('[google] falling back to redirect due to:', code);
        await signInWithRedirect(auth, provider);
        return { ok: false, error: 'redirecting' };
      } catch (e: any) {
        console.log('[google] redirect also failed:', e?.code);
        return { ok: false, error: e?.code || 'auth/redirect-error' };
      }
    }
    return { ok: false, error: code || 'auth/popup-error' };
  }
}

/** Complete a redirect sign-in if present. Safe to call on every mount. */
export async function consumeRedirectResult(): Promise<GoogleSignInResult | null> {
  try {
    console.log('[google] checking for redirect result');
    const cred = await getRedirectResult(auth);
    if (!cred) {
      console.log('[google] no redirect result found');
      return null;
    }
    console.log('[google] redirect result success:', cred.user.email);
    return { ok: true, cred };
  } catch (err: any) {
    const code = err?.code || '';
    const message = err?.message || '';
    console.log('[google] redirect result error:', { code, message });
    return { ok: false, error: code || 'auth/redirect-error' };
  }
}
