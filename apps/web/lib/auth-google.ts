'use client';

import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  type UserCredential,
} from 'firebase/auth';
import { auth } from './firebase.client';

export type GoogleSignInResult =
  | { ok: true; cred: UserCredential }
  | { ok: false; error: string };

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });
provider.addScope('email');
provider.addScope('profile');

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  try {
    if (!auth) throw new Error('Firebase auth not initialized');
    console.log('[google] attempting popup sign-in');
    const cred = await signInWithPopup(auth, provider);
    console.log('[google] popup success:', cred.user.email);
    return { ok: true, cred };
  } catch (err: any) {
    if (!auth) {
      return { ok: false, error: 'auth/not-initialized' };
    }
    const code = String(err?.code || '');
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

export async function consumeRedirectResult(): Promise<GoogleSignInResult | null> {
  try {
    if (!auth) return { ok: false, error: 'auth/not-initialized' };
    console.log('[google] checking for redirect result');
    const cred = await getRedirectResult(auth);
    if (!cred) {
      console.log('[google] no redirect result found');
      return null;
    }
    console.log('[google] redirect result success:', cred.user.email);
    return { ok: true, cred };
  } catch (err: any) {
    return { ok: false, error: String(err?.code || 'auth/redirect-error') };
  }
}
