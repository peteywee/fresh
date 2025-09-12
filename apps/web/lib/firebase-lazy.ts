// Lazy-loaded Firebase modules for better build performance
import type { Auth } from "firebase/auth";
import type { FirebaseApp } from "firebase/app";

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

export const getFirebaseApp = async (): Promise<FirebaseApp> => {
  if (firebaseApp) return firebaseApp;
  
  const { initializeApp, getApps } = await import("firebase/app");
  const apps = getApps();
  
  if (apps.length > 0) {
    firebaseApp = apps[0];
    return firebaseApp;
  }
  
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };
  
  firebaseApp = initializeApp(config);
  return firebaseApp;
};

export const getFirebaseAuth = async (): Promise<Auth> => {
  if (firebaseAuth) return firebaseAuth;
  
  const [{ getAuth }, app] = await Promise.all([
    import("firebase/auth"),
    getFirebaseApp(),
  ]);
  
  firebaseAuth = getAuth(app);
  return firebaseAuth;
};
