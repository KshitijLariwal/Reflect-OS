const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const target1 = 'pastContext = snapshot.docs.map(doc => doc.data().summary).join(" | ");';
const replace1 = 'pastContext = snapshot.docs.map(doc => "Memory ID [" + doc.id + "]: " + doc.data().summary).join(" | ");';
content = content.replace(target1, replace1);

const target2 = 'If relevant, subtly connect this to their past realization." : ""),';
const replace2 = 'If relevant, subtly connect this to their past realization. If you explicitly reference a past Memory ID to provide insight, you MUST append a strict markdown citation at the end of your thought formatted exactly like this: [Erase this echo](forget:{ID_HERE}). Do not use this syntax for anything else." : ""),';
content = content.replace(target2, replace2);

const target3 = 'async function startServer() {';
const replace3 = `app.delete('/api/journal/entries/:id', verifyAuth, async (req, res) => {
  try {
    const uid = req.uid;
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "No entry ID provided." });
    }
    const db = require('firebase-admin/firestore').getFirestore();
    await db.collection('users').doc(uid).collection('entries').doc(id).delete();
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete journal entry:", error);
    res.status(500).json({ error: "Failed to delete entry" });
  }
});

async function startServer() {`;
content = content.replace(target3, replace3);

fs.writeFileSync('server.ts', content);
console.log('Updated server.ts successfully');
