const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({
  projectId: 'gen-lang-client-0610859138'
});

async function run() {
  const db = getFirestore('ai-studio-reflectos-59ca32a0-9f51-499e-8eee-fda4f36aa976');
  console.log("Database ID:", db.databaseId);
  try {
    const docRef = await db.collection('users').doc('TESTING').collection('entries').add({ test: true });
    console.log("Added doc", docRef.id);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
run();
