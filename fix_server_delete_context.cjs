const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldEmpty = `    if (transcript.length === 0) {
      const emptyEntry = { transcript: [] };
      await docRef.update(emptyEntry);
      return res.json({ id, ...data, transcript: [], success: true, message: "Entry emptied" });
    }`;

const newEmpty = `    if (transcript.length === 0) {
      await docRef.delete();
      return res.json({ id, deleted: true, success: true, message: "Entry and context deleted" });
    }`;

if (code.includes(oldEmpty)) {
  code = code.replace(oldEmpty, newEmpty);
  fs.writeFileSync('server.ts', code);
  console.log("Updated server.ts to delete the whole entry when transcript is empty");
} else {
  console.log("Could not find the oldEmpty block");
}
