const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `});
    }

    const transcriptString = transcript.map((msg: any) => 
      \`[\${msg.role === 'user' ? 'User' : 'AI'}]: \${msg.text || msg.content}\`
    ).join('\\n');

    let response;
    try {
      // 1. Generate Summary
      response = await ai.models.generateContent({`;
      
const replacement = `});`;

code = code.replace(/    \}\n\n    const transcriptString = transcript\.map\([\s\S]*?\n    try \{\n      \/\/ 1\. Generate Summary\n      response = await ai\.models\.generateContent\(\{/, replacement);

fs.writeFileSync('server.ts', code);
console.log('Fixed duplicate syntax');
