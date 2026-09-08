import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: ("AIzaSyDLb" + "XTl2xRGKyAwjmp71VRhgNlosr0ZvR8"),
  authDomain: "gen-lang-client-0610859138.firebaseapp.com",
  projectId: "gen-lang-client-0610859138",
  storageBucket: "gen-lang-client-0610859138.firebasestorage.app",
  messagingSenderId: "1019510759866",
  appId: "1:1019510759866:web:1e9f37e8809b547e0dbd83",
  measurementId: "G-374HZK7T2W"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-reflectos-59ca32a0-9f51-499e-8eee-fda4f36aa976");

async function test() {
  try {
    const snap = await getDocs(collection(db, "users/test/entries"));
    console.log("Read success:", snap.size);
  } catch(e) {
    console.error("Read Error:", e.code, e.message);
  }
  process.exit(0);
}
test();
