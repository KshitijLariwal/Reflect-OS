const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldDelete = `app.delete('/api/journal/entries/:id', verifyAuth, async (req, res) => {
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
});`;

const newDelete = `app.delete('/api/journal/entries/:id', verifyAuth, async (req, res) => {
  try {
    const uid = (req as any).uid;
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: "No entry ID provided." });
    }
    
    // We are storing embeddings directly inside the Firestore document (as a VectorValue field).
    // Deleting the document itself fully purges the associated vector embeddings.
    const db = getFirestore(); // Note: backend admin SDK may need specific db string if permissions are configured for it
    await db.collection('users').doc(uid).collection('entries').doc(id).delete();
    
    res.status(200).json({ success: true, message: "Archive and vector embedding purged." });
  } catch (error: any) {
    console.error("Failed to delete journal entry:", error);
    res.status(500).json({ error: error.message || "Failed to delete entry" });
  }
});`;

if (code.includes("app.delete('/api/journal/entries/:id'")) {
  code = code.replace(oldDelete, newDelete);
  fs.writeFileSync('server.ts', code);
  console.log("Updated DELETE route");
} else {
  console.log("Could not find DELETE route");
}
