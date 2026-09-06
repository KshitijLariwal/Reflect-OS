import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ projectId: 'gen-lang-client-0610859138' });
const db = getFirestore();

async function test() {
  try {
    const q = db.collection('test').findNearest('embedding', FieldValue.vector([1,2,3]), { limit: 1, distanceMeasure: 'COSINE' });
    const snap = await q.get();
    console.log("Success:", snap.empty);
  } catch(e) {
    console.error("Error:", e);
  }
}
test();
