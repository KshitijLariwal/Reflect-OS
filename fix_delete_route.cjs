const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const deleteRoute = `
app.delete('/api/journal/entries/:id', verifyAuth, async (req, res) => {
  try {
    const uid = (req as any).uid;
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: "No entry ID provided." });
    }
    
    const db = getFirestore('ai-studio-reflectos-59ca32a0-9f51-499e-8eee-fda4f36aa976');
    await db.collection('users').doc(uid).collection('entries').doc(id).delete();
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete journal entry:", error);
    res.status(500).json({ error: "Failed to delete entry" });
  }
});
`;

if (!code.includes('/api/journal/entries/:id\', verifyAuth, async (req, res) => {')) {
  code = code.replace("async function startServer", deleteRoute + "\nasync function startServer");
}

fs.writeFileSync('server.ts', code);
console.log('Delete route added');
