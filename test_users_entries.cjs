const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: ("AIzaSyDLb" + "XTl2xRGKyAwjmp71VRhgNlosr0ZvR8"),
  authDomain: "gen-lang-client-0610859138.firebaseapp.com",
  projectId: "gen-lang-client-0610859138"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-reflectos-59ca32a0-9f51-499e-8eee-fda4f36aa976");

async function test() {
  console.log("Fetching all users...");
  try {
    const snap = await getDocs(collection(db, 'users'));
    console.log("Users found:", snap.size);
    snap.forEach(doc => {
      console.log(doc.ref.path);
    });
  } catch (e) {
    console.error("Error:", e.message);
  }
  process.exit(0);
}
test();
