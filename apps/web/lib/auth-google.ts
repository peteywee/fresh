'use client';

import {
  GoogleAuthProvider,
  type UserCredential,
  getAuth,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';

import { app } from '@/lib/firebase.client';

export type GoogleSignInResult = { ok: true; cred: UserCredential } | { ok: false; error: string };

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

/**
 * Try popup, fall back to redirect when blocked or canceled.
 * Call `consumeRedirectResult()` on page mount to finish redirect flows.
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  const auth = getAuth(app);
  try {
    const cred = await signInWithPopup(auth, provider);
    return { ok: true, cred };
  } catch (err: any) {
    const code: string = err?.code || '';
    const popupBlocked =
      code === 'auth/popup-blocked' ||
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request';

    if (popupBlocked) {
      await signInWithRedirect(auth, provider);
      return { ok: false, error: 'redirecting' };
    }

    return { ok: false, error: code || 'auth/unknown' };
  }
}

/** Complete a redirect sign-in if present. Safe to call on every mount. */
export async function consumeRedirectResult(): Promise<GoogleSignInResult | null> {
  const auth = getAuth(app);
  try {
    const cred = await getRedirectResult(auth);
    if (!cred) return null;
    return { ok: true, cred };
  } catch (err: any) {
    return { ok: false, error: err?.code || 'auth/redirect-error' };
  }
}
