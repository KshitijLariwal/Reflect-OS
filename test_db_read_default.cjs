const { initializeApp, getApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
initializeApp({ projectId: 'gen-lang-client-0610859138' });
async function test() {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('users').limit(1).get();
    console.log('Success reading from default db:', snapshot.docs.length);
  } catch (e) {
    console.error('Error reading from default db:', e);
  }
}
test();
