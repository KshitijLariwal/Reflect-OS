import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'gen-lang-client-0610859138' });
const db = getFirestore();

async function test() {
  try {
    const q = db.collection('test').limit(1);
    const snap = await q.get();
    console.log("Success:", snap.empty);
  } catch(e) {
    console.error("Error:", e);
  }
}
test();
