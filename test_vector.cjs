const { vector } = require('firebase/firestore');
try {
  const v = vector([1,2,3]);
  console.log("Vector:", v);
} catch (e) {
  console.error("Error:", e);
}
