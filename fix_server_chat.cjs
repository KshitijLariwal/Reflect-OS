const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const toReplace = `    try {
      if (message) {
        const embeddingResponse = await ai.models.embedContent({
          model: 'gemini-embedding-2',
          contents: message,
          config: {
            outputDimensionality: 768
          }
        });
        const queryVector = embeddingResponse.embeddings?.[0]?.values || [];

        // EDGE CASE 3: Firestore Vector Search
        if (queryVector.length > 0) {
          const db = getFirestore('ai-studio-reflectos-59ca32a0-9f51-499e-8eee-fda4f36aa976');
          const entriesRef = db.collection('users').doc(uid).collection('entries');
          const vectorQuery = entriesRef.findNearest('embedding', FieldValue.vector(queryVector), {
            limit: 2,
            distanceMeasure: 'COSINE'
          });
             
          const snapshot = await vectorQuery.get();
             
          // EDGE CASE 4: Brand new user with empty database
          if (!snapshot.empty) {
            pastContext = snapshot.docs.map(doc => "Memory ID [" + doc.id + "]: " + doc.data().summary).join(" | ");
          }
        }
      }
    } catch (error) {
      console.error("Vector Search failed, continuing without context:", error);
      // Fail gracefully; do not break the chat if search fails
    }`;

// Replace it with nothing since `pastContext` is now provided via `req.body.pastContext`
if (code.includes('EDGE CASE 3: Firestore Vector Search')) {
  // It's probably easier to use index replacement to be safe with indentation
  const startIndex = code.indexOf('    try {\n      if (message) {\n        const embeddingResponse');
  const endIndex = code.indexOf('    // Build the multimodal payload');
  if (startIndex !== -1 && endIndex !== -1) {
    code = code.substring(0, startIndex) + code.substring(endIndex);
    fs.writeFileSync('server.ts', code);
    console.log("Stripped backend vector search from server.ts");
  } else {
    console.log("Could not find block via indexOf");
  }
} else {
  console.log("Could not find EDGE CASE 3");
}
