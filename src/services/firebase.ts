import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBckLuMTKTjJrtDtkSXEW9cv8PlLdQbNE8',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'halcones-flag.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'halcones-flag',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'halcones-flag.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '5448648589',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:5448648589:web:574108fb3d89f7d6a25fc4',
};

// Check if credentials are provided in environment or fallback
export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== 'TU_API_KEY_AQUI'
  );
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (err) {
    console.error('Error inicializando Firebase:', err);
  }
}

export { app, db };
