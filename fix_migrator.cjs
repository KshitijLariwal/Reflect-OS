const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Add test auth route
const testAuthRoute = `
app.get('/api/test-auth', verifyAuth, (req, res) => {
  res.json({ message: "Auth successful", uid: (req as any).uid });
});
`;

code = code.replace("// verifyAuth middleware", testAuthRoute + "\n// verifyAuth middleware");
fs.writeFileSync('server.ts', code);
console.log("Added test auth route");
