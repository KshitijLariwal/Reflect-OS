const firestore = require('firebase/firestore');
console.log("Exports:", Object.keys(firestore).filter(k => k.includes('Nearest') || k.includes('vector') || k.includes('Vector')));
