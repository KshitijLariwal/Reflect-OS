const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
initializeApp({ projectId: 'gen-lang-client-0610859138' });
const db = getFirestore('ai-studio-reflectos-59ca32a0-9f51-499e-8eee-fda4f36aa976');
db.collectionGroup('entries').get().then(snap => {
  console.log("Entries found:", snap.size);
  snap.forEach(doc => {
      console.log(doc.ref.path);
  });
}).catch(console.error);
