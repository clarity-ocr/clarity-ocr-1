import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB_H6LNPnzGAU2_oObVxelH1vm-VEIYFBM",
  authDomain: "clarity-ocr-team.firebaseapp.com",
  projectId: "clarity-ocr-team",
  storageBucket: "clarity-ocr-team.firebasestorage.app",
  messagingSenderId: "807363177666",
  appId: "1:807363177666:web:26753345b0752ca6e15f5b",
  measurementId: "G-6RTZRMYC2N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;