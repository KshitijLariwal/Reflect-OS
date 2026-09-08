const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/text-embedding-004/g, 'gemini-embedding-2');

fs.writeFileSync('server.ts', code);
console.log('Fixed embeddings to gemini-embedding-2 in server.ts');
