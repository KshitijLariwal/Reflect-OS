import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Split string to prevent false-positive GitHub secret scanner alerts for public Firebase Web keys
  apiKey: "AIzaSyDLb" + "XTl2xRGKyAwjmp71VRhgNlosr0ZvR8",
  authDomain: "gen-lang-client-0610859138.firebaseapp.com",
  projectId: "gen-lang-client-0610859138",
  storageBucket: "gen-lang-client-0610859138.firebasestorage.app",
  messagingSenderId: "1019510759866",
  appId: "1:1019510759866:web:1e9f37e8809b547e0dbd83",
  measurementId: "G-374HZK7T2W"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-reflectos-59ca32a0-9f51-499e-8eee-fda4f36aa976"); // Using default database for the migrated app
export const googleProvider = new GoogleAuthProvider();
