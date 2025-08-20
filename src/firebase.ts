import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- START OF CRITICAL DEBUGGING CODE ---
// This will print the status of your environment variables to the browser console.
// This is the definitive test to see if Vercel is passing them to your application.
console.log("--- VERCEL ENVIRONMENT VARIABLE CHECK ---");
console.log("VITE_FIREBASE_API_KEY: ", import.meta.env.VITE_FIREBASE_API_KEY ? "✅ Loaded" : "❌ MISSING or EMPTY!");
console.log("VITE_FIREBASE_AUTH_DOMAIN: ", import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? "✅ Loaded" : "❌ MISSING or EMPTY!");
console.log("VITE_FIREBASE_PROJECT_ID: ", import.meta.env.VITE_FIREBASE_PROJECT_ID ? "✅ Loaded" : "❌ MISSING or EMPTY!");
console.log("---------------------------------------");
// --- END OF CRITICAL DEBUGGING CODE ---

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase App (ensuring it's only done once)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);