const admin = require("firebase-admin");
const { initializeApp } = require("firebase/app");
const { getAuth, signInWithCustomToken } = require("firebase/auth");
const { getFirestore, collection, addDoc, getDocs } = require("firebase/firestore");

admin.initializeApp();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || ("AIzaSyDLb" + "XTl2xRGKyAwjmp71VRhgNlosr0ZvR8"),
  authDomain: "gen-lang-client-0610859138.firebaseapp.com",
  projectId: "gen-lang-client-0610859138"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, "ai-studio-reflectos-59ca32a0-9f51-499e-8eee-fda4f36aa976");

async function test() {
  try {
    const customToken = await admin.auth().createCustomToken("test-uid-123");
    console.log("Custom token generated!");
    
    const cred = await signInWithCustomToken(auth, customToken);
    const uid = cred.user.uid;
    console.log("Signed in as", uid);

    const ref = collection(db, 'users', uid, 'entries');
    console.log("Adding doc...");
    const docRef = await addDoc(ref, { title: "Test" });
    console.log("Added doc", docRef.id);

    const snap = await getDocs(ref);
    console.log("Fetched docs:", snap.size);
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
test();
