const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({
  projectId: 'gen-lang-client-0610859138'
});

const db = getFirestore('ai-studio-reflectos-59ca32a0-9f51-499e-8eee-fda4f36aa976');

async function check() {
  const users = await db.collection('users').get();
  console.log("Users:", users.size);
  // Admin SDK in this environment fails with permission denied because it lacks credentials.
}
check().catch(console.error);
