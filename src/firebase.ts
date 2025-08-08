// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDLGxrUcqdKG8nP6xYzZkQ2wM05Y_qsrXw",
  authDomain: "clarity-ocr.firebaseapp.com",
  projectId: "clarity-ocr",
  storageBucket: "clarity-ocr.firebasestorage.app",
  messagingSenderId: "1017239679262",
  appId: "1:1017239679262:web:0980139ee59f62519f990f",
  measurementId: "G-ZDRJ93FKRV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);