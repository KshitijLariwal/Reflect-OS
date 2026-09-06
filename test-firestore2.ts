import { getFirestore, FieldValue } from 'firebase-admin/firestore';
const db = getFirestore();
const col = db.collection('test');
console.log(typeof col.findNearest);
