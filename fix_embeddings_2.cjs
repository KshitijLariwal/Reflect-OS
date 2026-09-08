const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/text-embedding-005/g, 'text-embedding-004');

fs.writeFileSync('server.ts', code);
console.log('Fixed embeddings in server.ts');
