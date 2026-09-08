const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target1 = `import { initializeApp, getApps, getApp } from 'firebase-admin/app';`;
const replace1 = `import { initializeApp, getApps, getApp, cert, applicationDefault } from 'firebase-admin/app';`;

const target2 = `import { credential } from 'firebase-admin';`;
const replace2 = ``;

const target3 = `  credential: serviceAccount ? credential.cert(serviceAccount) : credential.applicationDefault(),`;
const replace3 = `  credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),`;

code = code.replace(target1, replace1).replace(target2, replace2).replace(target3, replace3);
fs.writeFileSync('server.ts', code);
console.log("Fixed server.ts firebase-admin imports");
