const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldDelete = `      // Background unawaited deletion
      void deleteDoc(docRef).catch(err => console.error('Background delete failed', err));
    }, 800);`;

const newDelete = `      // Background backend deletion
      void (async () => {
        try {
          const token = await auth.currentUser?.getIdToken();
          await fetch(\`/api/journal/entries/\${id}\`, {
            method: 'DELETE',
            headers: { 'Authorization': \`Bearer \${token}\` }
          });
        } catch (err) {
          console.error('Background delete failed', err);
        }
      })();
    }, 800);`;

if (code.includes(oldDelete)) {
  code = code.replace(oldDelete, newDelete);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Updated App.tsx to use backend for full entry deletion");
} else {
  console.log("Could not find the oldDelete block");
}
