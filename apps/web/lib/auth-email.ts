import { signInWithEmailAndPassword } from 'firebase/auth';

export async function signInWithEmail(email: string, password: string) {
  try {
    // Import Firebase auth lazily to avoid SSR issues
    const { auth } = await import('./firebase.client');

    if (!auth) {
      return { ok: false, error: 'Firebase not initialized' };
    }

    // Sign in with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Get the ID token
    const idToken = await userCredential.user.getIdToken();

    // Exchange token with our session API
    const response = await fetch('/api/session/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (response.ok) {
      return { ok: true };
    } else {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      return { ok: false, error: error.error || 'Login failed' };
    }
  } catch (error: any) {
    console.error('Email sign in error:', error);

    // Handle Firebase auth errors
    if (error.code === 'auth/user-not-found') {
      return { ok: false, error: 'No account found with this email' };
    } else if (error.code === 'auth/wrong-password') {
      return { ok: false, error: 'Incorrect password' };
    } else if (error.code === 'auth/invalid-email') {
      return { ok: false, error: 'Invalid email address' };
    } else if (error.code === 'auth/user-disabled') {
      return { ok: false, error: 'This account has been disabled' };
    } else {
      return { ok: false, error: 'Login failed. Please try again.' };
    }
  }
}
