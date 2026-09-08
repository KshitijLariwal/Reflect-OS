const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `className={\`flex group \${msg.role === 'user' ? 'justify-end' : 'justify-start'}\`}`,
  `className={\`flex group \${msg.role === 'user' ? 'justify-end' : 'justify-start'} \${burningMessages.includes(i) ? 'ink-bleed' : ''}\`}`
);

fs.writeFileSync('src/App.tsx', code);
console.log("Updated transcript class");
