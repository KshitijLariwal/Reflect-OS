const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldDelete = `    if (transcript.length === 0) {
      await docRef.delete();
      return res.json({ deleted: true });
    }`;

const newEmpty = `    if (transcript.length === 0) {
      const emptyEntry = { transcript: [] };
      await docRef.update(emptyEntry);
      return res.json({ id, ...data, transcript: [], success: true, message: "Entry emptied" });
    }`;

if (code.includes(oldDelete)) {
  code = code.replace(oldDelete, newEmpty);
  fs.writeFileSync('server.ts', code);
  console.log("Updated server.ts omit route");
} else {
  console.log("Could not find old delete block");
}
