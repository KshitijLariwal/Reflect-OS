const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const patchEndpoint = `
app.patch('/api/journal/entries/:id/omit', verifyAuth, async (req, res) => {
  try {
    const uid = (req as any).uid;
    const { id } = req.params;
    const { messageIndex } = req.body;
    
    if (typeof messageIndex !== 'number') {
      return res.status(400).json({ error: "Invalid messageIndex provided." });
    }

    const db = getFirestore('ai-studio-reflectos-59ca32a0-9f51-499e-8eee-fda4f36aa976');
    const docRef = db.collection('users').doc(uid).collection('entries').doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return res.status(404).json({ error: "Entry not found." });
    }
    
    const data = docSnap.data();
    let transcript = data.transcript;
    
    // If transcript is stored as a stringified JSON array, parse it
    if (typeof transcript === 'string') {
      try {
        transcript = JSON.parse(transcript);
      } catch (e) {
        return res.status(400).json({ error: "Failed to parse transcript." });
      }
    }
    
    if (!Array.isArray(transcript)) {
      return res.status(400).json({ error: "Transcript is not an array." });
    }
    
    if (messageIndex < 0 || messageIndex >= transcript.length) {
      return res.status(400).json({ error: "Message index out of bounds." });
    }
    
    // Splice out the item
    transcript.splice(messageIndex, 1);
    
    // If empty, delete document
    if (transcript.length === 0) {
      await docRef.delete();
      return res.json({ success: true, deleted: true });
    }
    
    const transcriptString = JSON.stringify(transcript);
    
    // Generate new summary
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: \`Distill this journal transcript into a raw JSON object: { "title": "string", "summary": "string", "mood": "string", "tags": ["string"] }\\n\\nFocus strictly on the core intellectual, technical, or structural themes. Do not let fleeting conversational phrases or temporary fatigue hijack the summary into a 'burnout' or 'solace' narrative. Maintain grounded, objective insights.\\n\\n\${transcriptString}\`,
      config: {
        responseMimeType: "application/json"
      }
    });

    let parsedSummary;
    try {
      parsedSummary = JSON.parse(response.text?.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '') || '{}');
      if (!parsedSummary.title || !parsedSummary.summary) {
        throw new Error("Missing required summary fields");
      }
    } catch (e) {
      parsedSummary = { title: "Archived Whisper", summary: "A quiet reflection.", mood: "calm", tags: ["reflection"] };
    }

    // Generate new embedding
    const embedResult = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: \`\${parsedSummary.title}: \${parsedSummary.summary}\`,
      config: {
        outputDimensionality: 768
      }
    });
    
    const vector = embedResult.embeddings?.[0]?.values || [];
    
    const updatedData = {
      ...parsedSummary,
      transcript: transcriptString,
      embedding: FieldValue.vector(vector)
    };
    
    await docRef.update(updatedData);
    
    res.json({ success: true, entry: { id, ...data, ...updatedData } });
  } catch (error) {
    console.error("Failed to omit memory:", error);
    res.status(500).json({ error: "Failed to omit memory" });
  }
});

`;

const target = "app.delete('/api/journal/entries/:id', verifyAuth, async (req, res) => {";
code = code.replace(target, patchEndpoint + target);

fs.writeFileSync('server.ts', code);
console.log('Appended PATCH endpoint');
