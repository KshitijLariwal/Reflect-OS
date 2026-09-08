const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `// Initialize Firebase Admin
const serviceAccount = process.env.FIREBASE_PRIVATE_KEY ? {
  projectId: process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0610859138',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, '\\n'),
} : undefined;

initializeApp({
  credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0610859138'
});`;

const replaceStr = `// Initialize Firebase Admin
try {
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
  const formattedPrivateKey = rawKey
    ? (rawKey.includes('-----BEGIN PRIVATE KEY-----')
        ? rawKey.replace(/\\\\n/g, '\\n')
        : Buffer.from(rawKey, 'base64').toString('utf-8'))
    : undefined;

  const serviceAccount = formattedPrivateKey ? {
    projectId: process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0610859138',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: formattedPrivateKey,
  } : undefined;

  initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0610859138'
  });
  console.log("Firebase Admin initialized successfully.");
} catch (error) {
  console.error("Firebase Admin initialization failed. Server will continue to start to serve health checks, but Firebase features will fail:", error);
}`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync('server.ts', code);
console.log("Updated server.ts with Base64 key parsing and fault tolerance.");
