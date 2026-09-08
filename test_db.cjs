const { initializeApp, getApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
initializeApp({ projectId: 'gen-lang-client-0610859138' });
try {
  const db = getFirestore(getApp(), 'ai-studio-reflectos-59ca32a0-9f51-499e-8eee-fda4f36aa976');
  console.log('Success initializing with db id');
} catch (e) {
  console.error(e);
}
