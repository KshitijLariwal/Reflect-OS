const { initializeApp, getApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
initializeApp({ projectId: 'gen-lang-client-0610859138' });
async function test() {
  try {
    const db = getFirestore(getApp(), 'ai-studio-reflectos-59ca32a0-9f51-499e-8eee-fda4f36aa976');
    const snapshot = await db.collection('users').limit(1).get();
    console.log('Success reading from db id:', snapshot.docs.length);
  } catch (e) {
    console.error('Error reading from db id:', e);
  }
}
test();
