const { initializeApp } = require("firebase/app");
const { getFirestore, collectionGroup, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: ("AIzaSyDLb" + "XTl2xRGKyAwjmp71VRhgNlosr0ZvR8"),
  authDomain: "gen-lang-client-0610859138.firebaseapp.com",
  projectId: "gen-lang-client-0610859138"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  console.log("Fetching all entries from default...");
  try {
    const snap = await getDocs(collectionGroup(db, 'entries'));
    console.log("Entries found:", snap.size);
    snap.forEach(doc => {
      console.log(doc.ref.path, "=>", JSON.stringify(doc.data()).substring(0, 50));
    });
  } catch (e) {
    console.error("Error:", e.message);
  }
  process.exit(0);
}
test();
