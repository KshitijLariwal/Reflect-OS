const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `// Example protected AI route
  try {
    const { text } = req.body;`;

const replaceStr = `// Example protected AI route
app.post('/api/journal/embed', verifyAuth, async (req, res) => {
  try {
    const { text } = req.body;`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('server.ts', code);
console.log("Fixed missing declaration");
