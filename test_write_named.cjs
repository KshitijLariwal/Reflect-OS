const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: ("AIzaSyDLb" + "XTl2xRGKyAwjmp71VRhgNlosr0ZvR8"),
  authDomain: "gen-lang-client-0610859138.firebaseapp.com",
  projectId: "gen-lang-client-0610859138"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-reflectos-59ca32a0-9f51-499e-8eee-fda4f36aa976");

async function test() {
  try {
    const docRef = await addDoc(collection(db, "test_collection"), {
      test: "data"
    });
    console.log("Document written with ID: ", docRef.id);
    
    const snap = await getDocs(collection(db, "test_collection"));
    console.log("Documents read: ", snap.size);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
  process.exit(0);
}
test();
