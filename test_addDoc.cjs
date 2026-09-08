const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, serverTimestamp } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "FAKE_API_KEY",
  projectId: "fake-project"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  console.log("Adding doc...");
  try {
    const promise = addDoc(collection(db, "users"), { a: 1, createdAt: serverTimestamp() });
    const timeout = new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 3000));
    await Promise.race([promise, timeout]);
    console.log("Doc added!");
  } catch (e) {
    console.error("Error:", e.message);
  }
  process.exit(0);
}
test();
