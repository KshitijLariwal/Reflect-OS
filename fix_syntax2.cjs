const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\n    \}\n\n    const transcriptString = Array\.isArray\(transcript\) \? JSON\.stringify\(transcript\) \: transcript;[\s\S]*?\n\}\);\n/;
code = code.replace(regex, '');

fs.writeFileSync('server.ts', code);
console.log('Cleaned up duplicated bad code');
