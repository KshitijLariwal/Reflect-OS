const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Update verifyAuth middleware
const verifyAuthRegex = /const verifyAuth = async \(req: express\.Request, res: express\.Response, next: express\.NextFunction\) => \{[\s\S]*?\n\};\n/g;

const newVerifyAuth = `const verifyAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized: Missing or invalid Authorization header" });
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    (req as any).user = decodedToken;
    (req as any).uid = decodedToken.uid;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(403).json({ error: "Unauthorized: Invalid token or Firebase Admin not initialized" });
  }
};
`;
code = code.replace(verifyAuthRegex, newVerifyAuth);

// 3. Update catch blocks to return { error: error.message }
// /api/chat
code = code.replace(
  `res.status(500).json({ error: 'Internal server error' });`,
  `res.status(500).json({ error: error.message || 'Internal server error' });`
);

// /api/journal/summarize
code = code.replace(
  `res.status(500).json({ error: 'Failed to bind the pages to the archive.', details: error.message, stack: error.stack });`,
  `res.status(500).json({ error: error.message || 'Failed to bind the pages to the archive.' });`
);

// /api/journal/entries/:id/omit
code = code.replace(
  `res.status(500).json({ error: 'Failed to omit message.', details: error.message });`,
  `res.status(500).json({ error: error.message || 'Failed to omit message.' });`
);

// /api/journal/entries/:id
code = code.replace(
  `res.status(500).json({ error: "Failed to delete entry" });`,
  `res.status(500).json({ error: error.message || "Failed to delete entry" });`
);

// /api/vision/scan
code = code.replace(
  `res.status(500).json({ error: "The ink is too faded to read." });`,
  `res.status(500).json({ error: error.message || "The ink is too faded to read." });`
);

fs.writeFileSync('server.ts', code);
console.log('server.ts updated');
