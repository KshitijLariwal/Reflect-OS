const firestore = require('firebase/firestore');
console.log(Object.keys(firestore).filter(k => k.includes('vec')));
