const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "const testDoc = getFirestore().collection('system_tests').doc('connection_check');",
  "const testDoc = getFirestore('ai-studio-reflectos-59ca32a0-9f51-499e-8eee-fda4f36aa976').collection('system_tests').doc('connection_check');"
);

fs.writeFileSync('server.ts', code);
console.log('Updated test route with database ID');
