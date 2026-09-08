const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const badRoute = `
app.get('/api/test-auth', verifyAuth, (req, res) => {
  res.json({ message: "Auth successful", uid: (req as any).uid });
});
`;

code = code.replace(badRoute, "");

const authMiddleware = `  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(403).json({ error: "Unauthorized: Invalid token or Firebase Admin not initialized" });
  }
};`;

const targetRoute = `
app.get('/api/test-auth', verifyAuth, (req, res) => {
  res.json({ message: "Auth successful", uid: (req as any).uid });
});
`;

code = code.replace(authMiddleware, authMiddleware + "\n" + targetRoute);
fs.writeFileSync('server.ts', code);
console.log('Fixed verifyAuth route position');
