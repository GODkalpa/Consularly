import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

import { getApps, getApp, type FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Only initialize Firebase on the client to avoid SSR/prerender crashes
const isBrowser = typeof window !== 'undefined';
let app: FirebaseApp | undefined;

const isConfigValid = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

if (isBrowser) {
  // Prevent re-initialization in client (e.g., HMR)
  if (isConfigValid) {
    app = !getApps().length ? initializeApp(firebaseConfig as any) : getApp();
  } else {
    // Non-blocking warning for missing env vars
    // eslint-disable-next-line no-console
    console.warn('[firebase] Missing NEXT_PUBLIC_FIREBASE_* environment variables. Firebase not initialized.');
  }
}

// Export typed placeholders on the server to satisfy TS, real instances on the client
export const auth: Auth = isBrowser && app ? getAuth(app) : ({} as Auth);
export const db: Firestore = isBrowser && app ? getFirestore(app) : ({} as Firestore);
export const firebaseEnabled: boolean = Boolean(app);

export default app as FirebaseApp | undefined;
