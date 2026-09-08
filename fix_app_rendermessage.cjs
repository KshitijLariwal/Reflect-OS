const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `}  const renderMessage = (text: string) => {`;
if (code.includes(targetStr)) {
  code = code.replace(targetStr, `
  const renderMessage = (text: string) => {`);
  code += `\n}\n`;
  fs.writeFileSync('src/App.tsx', code);
  console.log("Fixed renderMessage scoping");
} else {
  console.log("Could not find target string");
}
