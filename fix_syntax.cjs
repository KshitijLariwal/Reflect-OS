const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const startIndex = code.indexOf("app.delete('/api/journal/entries/:id'");
const endIndex = code.indexOf("async function startServer()");

if (startIndex !== -1 && endIndex !== -1) {
  const cleanDelete = `app.delete('/api/journal/entries/:id', verifyAuth, async (req, res) => {
  try {
    const uid = (req as any).uid;
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: "No entry ID provided." });
    }
    
    const db = getFirestore();
    await db.collection('users').doc(uid).collection('entries').doc(id).delete();
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete journal entry:", error);
    res.status(500).json({ error: error.message || "Failed to delete entry" });
  }
});\n\n`;

  code = code.substring(0, startIndex) + cleanDelete + code.substring(endIndex);
  fs.writeFileSync('server.ts', code);
  console.log("Syntax fixed!");
} else {
  console.log("Could not find blocks");
}
