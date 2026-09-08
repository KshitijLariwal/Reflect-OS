const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({
  projectId: 'gen-lang-client-0610859138'
});

async function run() {
  const db = getFirestore();
  console.log("Database ID:", db.databaseId);
  try {
    const docRef = await db.collection('users').doc('TESTING').collection('entries').add({ test: true });
    console.log("Added doc", docRef.id);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
run();
