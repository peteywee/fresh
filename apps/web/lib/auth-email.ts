'use client';

import {
  type UserCredential,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';

import { auth } from './firebase.client';

export async function emailSignIn(email: string, password: string): Promise<UserCredential> {
  if (!auth) throw new Error('Firebase auth not initialized');
  return signInWithEmailAndPassword(auth, email, password);
}

export async function emailRegister(email: string, password: string): Promise<UserCredential> {
  if (!auth) throw new Error('Firebase auth not initialized');
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function emailResetPassword(email: string): Promise<void> {
  if (!auth) throw new Error('Firebase auth not initialized');
  return sendPasswordResetEmail(auth, email);
}
