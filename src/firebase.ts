import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDLbXTl2xRGKyAwjmp71VRhgNlosr0ZvR8",
  authDomain: "gen-lang-client-0610859138.firebaseapp.com",
  projectId: "gen-lang-client-0610859138",
  storageBucket: "gen-lang-client-0610859138.firebasestorage.app",
  messagingSenderId: "1019510759866",
  appId: "1:1019510759866:web:1e9f37e8809b547e0dbd83",
  measurementId: "G-374HZK7T2W"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
