// Firebase configuration
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// For development/testing purposes - use these values if environment variables are missing
const devConfig = {
  apiKey: "AIzaSyDev-key-placeholder",
  authDomain: "preptalkai-dev.firebaseapp.com",
  projectId: "preptalkai-dev",
  storageBucket: "preptalkai-dev.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcd1234",
  measurementId: "G-ABCD1234"
};

// Use environment variables if available, otherwise use dev config
const configToUse = 
  Object.values(firebaseConfig).some(value => !value) ? devConfig : firebaseConfig;

// Singleton pattern - Initialize Firebase only if it hasn't been initialized already
let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(configToUse);
} else {
  app = getApps()[0]; // Use the existing app if already initialized
}

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage, app };
