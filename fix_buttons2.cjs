const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/onClick=\{\(\) => removeMessage\(selectedEntry\.id, i\)\}/g, "onClick={(e) => removeMessage(selectedEntry.id, i, e)}");

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated');
