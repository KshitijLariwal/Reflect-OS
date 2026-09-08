const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/getFirestore\(\)/g, "getFirestore('ai-studio-reflectos-59ca32a0-9f51-499e-8eee-fda4f36aa976')");
fs.writeFileSync('server.ts', code);
console.log("Updated server.ts database references");
