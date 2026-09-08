const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const omitRegex = /app\.patch\('\/api\/journal\/entries\/:id\/omit'[\s\S]*?\}\);\n*/;
const deleteRegex = /app\.delete\('\/api\/journal\/entries\/:id'[\s\S]*?\}\);\n*/;

code = code.replace(omitRegex, '');
code = code.replace(deleteRegex, '');

fs.writeFileSync('server.ts', code);
console.log('Backend routes cleaned');
