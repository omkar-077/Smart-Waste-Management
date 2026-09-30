import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smartwaste-6ebf0.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://smartwaste-6ebf0-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smartwaste-6ebf0",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "smartwaste-6ebf0.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "113465599162",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:113465599162:web:demo",
};

const hasRealConfig = Boolean(
  (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== "") ||
  (import.meta.env.VITE_FIREBASE_DATABASE_URL && import.meta.env.VITE_FIREBASE_DATABASE_URL !== "") ||
  firebaseConfig.databaseURL
);

if (!hasRealConfig) {
  console.warn(
    "[SmartWaste] Firebase credentials not configured.\n" +
    "Copy frontend/.env.example to frontend/.env and fill in your Firebase credentials.\n" +
    "See README.md for setup instructions."
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);
export { hasRealConfig };
export default app;
