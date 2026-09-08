const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /  const renderMessage = \(text: string\) => \{[\s\S]*?  \};\n*/;
const match = code.match(regex);
if (match) {
  const renderMessageStr = match[0];
  code = code.replace(renderMessageStr, '');
  
  const handleSendIndex = code.indexOf('const handleSend = async () => {');
  code = code.slice(0, handleSendIndex) + renderMessageStr + '\n  ' + code.slice(handleSendIndex);
  
  fs.writeFileSync('src/App.tsx', code);
  console.log('App.tsx fixed');
} else {
  console.log('Could not find renderMessage');
}
