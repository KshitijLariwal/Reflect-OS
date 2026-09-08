const fs = require('fs');
let code = fs.readFileSync('src/firebase.ts', 'utf8');

// The error says "Database '(default)' not found"
// We need to explicitly initialize Firestore with the reflectos-web databaseId

code = code.replace(
  `export const db = getFirestore(app);`,
  `export const db = getFirestore(app, "ai-studio-reflectos-59ca32a0-9f51-499e-8eee-fda4f36aa976");`
);

fs.writeFileSync('src/firebase.ts', code);
console.log("Updated firebase.ts with explicit databaseId");
