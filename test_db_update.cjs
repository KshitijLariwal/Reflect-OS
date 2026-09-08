const { initializeApp, getApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
initializeApp({ projectId: 'gen-lang-client-0610859138' });
async function test() {
  try {
    const db = getFirestore(getApp(), 'ai-studio-reflectos-59ca32a0-9f51-499e-8eee-fda4f36aa976');
    await db.collection('system_tests').doc('test').set({ time: Date.now() });
    console.log('Success writing to db id');
  } catch (e) {
    console.error('Error writing to db id:', e.message);
  }
}
test();
