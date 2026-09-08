const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = "const db = require('firebase-admin/firestore').getFirestore();";
const replace = "const db = getFirestore('ai-studio-reflectos-59ca32a0-9f51-499e-8eee-fda4f36aa976');";
code = code.replace(target, replace);

fs.writeFileSync('server.ts', code);
console.log('Fixed DB instantiation');
