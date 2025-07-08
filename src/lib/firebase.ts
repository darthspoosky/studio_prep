
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// IMPORTANT: Your Firebase project configuration should be set in environment variables.
// Create a .env.local file in the root of your project and add your keys there.
// e.g., NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;
let storage: FirebaseStorage | undefined;

// This check prevents errors during hot-reloading in development
if (firebaseConfig.projectId) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
} else {
    console.warn("Firebase config not found, features requiring Firebase will be disabled.");
}


export { app, db, auth, storage };

// Type guard functions to check if Firebase services are initialized
export function isFirebaseInitialized(): boolean {
  return app !== undefined;
}

export function isFirestoreInitialized(): boolean {
  return db !== undefined;
}

export function isAuthInitialized(): boolean {
  return auth !== undefined;
}

export function isStorageInitialized(): boolean {
  return storage !== undefined;
}

    