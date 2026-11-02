import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  onAuthStateChanged
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDMmigviIdH-tj06rAO1ZWjfRfQQhEPUOs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "chatbot-dbb73.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "chatbot-dbb73",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "chatbot-dbb73.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "195056198341",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:195056198341:web:9b6aba10c7b221ddc346ac",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-0TFSPR79KR"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  onAuthStateChanged
};

export default app;
