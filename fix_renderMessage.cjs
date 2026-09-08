const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\s*const renderMessage = \(text: string\) => \{[\s\S]*?return <span key=\{i\}>\{part\}<\/span>;\n    \}\);\n  \};/g;

const match = code.match(regex);
if (match) {
  const funcCode = match[0];
  // Remove it from current position
  code = code.replace(funcCode, '');
  
  // Insert it before `if (loading) {`
  const targetStr = 'if (loading) {';
  const targetIdx = code.indexOf(targetStr);
  if (targetIdx !== -1) {
    code = code.substring(0, targetIdx) + funcCode.trim() + '\n\n  ' + code.substring(targetIdx);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Moved renderMessage successfully.");
  } else {
    console.log("Could not find 'if (loading) {'");
  }
} else {
  console.log("Could not match renderMessage function.");
}
