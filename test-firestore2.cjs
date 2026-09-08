const { Firestore } = require('@google-cloud/firestore');

async function test() {
  try {
    const db = new Firestore({
      projectId: 'gen-lang-client-0610859138',
      databaseId: 'ai-studio-reflectos-59ca32a0-9f51-499e-8eee-fda4f36aa976'
    });
    const snap = await db.collection('users').limit(1).get();
    console.log('Success with @google-cloud/firestore:', snap.docs.length);
  } catch(e) {
    console.error('Error with @google-cloud/firestore:', e.message);
  }
}
test();
