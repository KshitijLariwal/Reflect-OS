const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `// Initialize Firebase Admin
initializeApp({
  projectId: 'gen-lang-client-0610859138'
});`;

const replaceStr = `import { credential } from 'firebase-admin';

// Initialize Firebase Admin
const serviceAccount = process.env.FIREBASE_PRIVATE_KEY ? {
  projectId: process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0610859138',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, '\\n'),
} : undefined;

initializeApp({
  credential: serviceAccount ? credential.cert(serviceAccount) : credential.applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0610859138'
});`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  
  // also fix PORT
  code = code.replace('const PORT = 3000;', 'const PORT = process.env.PORT || 3000;');
  
  fs.writeFileSync('server.ts', code);
  console.log("Updated server.ts with Firebase credentials and PORT");
} else {
  console.log("Could not find Firebase init block.");
}
