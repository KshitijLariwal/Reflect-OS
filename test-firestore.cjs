const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = initializeApp({
  projectId: 'gen-lang-client-0610859138'
});

async function test() {
  try {
    const db = getFirestore('ai-studio-reflectos-59ca32a0-9f51-499e-8eee-fda4f36aa976');
    const snap = await db.collection('users').limit(1).get();
    console.log('Success, found docs:', snap.docs.length);
  } catch(e) {
    console.error('Error with string:', e.message);
  }

  try {
    const db2 = getFirestore(app, 'ai-studio-reflectos-59ca32a0-9f51-499e-8eee-fda4f36aa976');
    const snap2 = await db2.collection('users').limit(1).get();
    console.log('Success with app + string:', snap2.docs.length);
  } catch(e) {
    console.error('Error with app + string:', e.message);
  }
}
test();
