const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, getDocs, vector } = require("firebase/firestore");
const { getAuth, signInAnonymously } = require("firebase/auth");

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
    const cred = await signInAnonymously(auth);
    const uid = cred.user.uid;
    console.log("Signed in as", uid);

    const ref = collection(db, 'users', uid, 'entries');
    const docRef = await addDoc(ref, {
      title: "Test",
      embedding: vector([1,2,3])
    });
    console.log("Added doc", docRef.id);

    const snap = await getDocs(ref);
    console.log("Fetched docs:", snap.size);
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
test();
