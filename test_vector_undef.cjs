const { vector } = require('firebase/firestore');
try {
  console.log(vector(undefined));
} catch (e) {
  console.error("Error:", e.message);
}
