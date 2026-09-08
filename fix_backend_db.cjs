const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// The initialization already uses gen-lang-client-0610859138
// So we just need to fix /api/journal/summarize and /api/journal/entries/:id/omit

const summarizeRouteRegex = /app\.post\('\/api\/journal\/summarize', verifyAuth, async \(req, res\) => \{[\s\S]*?\}\);\n/g;

const newSummarize = `app.post('/api/journal/summarize', verifyAuth, async (req, res) => {
  try {
    const uid = (req as any).uid;
    const { transcript } = req.body;
    
    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return res.status(400).json({ error: "No whispers to archive." });
    }

    const transcriptString = transcript.map((msg: any) => 
      \`[\${msg.role === 'user' ? 'User' : 'AI'}]: \${msg.text || msg.content}\`
    ).join('\\n');

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: \`Distill this journal transcript into a JSON object: {title, summary, mood, tags}. Maintain a scholarly, objective Dark Academia tone. CRITICAL: You MUST accurately capture all concrete factual events, physical objects, technical issues, and specific tools mentioned (e.g. Go, goroutines, databases). Do not omit facts for philosophy.\\n\\n\${transcriptString}\`,
        config: {
          responseMimeType: "application/json"
        }
      });
    } catch (apiError: any) {
      console.error("Gemini API Error during summarization:", apiError);
      return res.status(500).json({ error: "Failed to generate summary from AI", details: apiError.message });
    }

    let parsedSummary;
    try {
      parsedSummary = JSON.parse(response.text?.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '') || '{}');
      if (!parsedSummary.title || !parsedSummary.summary) {
        throw new Error("Missing required summary fields");
      }
    } catch (e) {
      parsedSummary = { title: "Archived Whisper", summary: "A quiet reflection.", mood: "calm", tags: ["reflection"] };
    }

    const embedResult = await ai.models.embedContent({
      model: 'text-embedding-005',
      contents: \`\${parsedSummary.title}: \${parsedSummary.summary}\`,
      config: {
        outputDimensionality: 768
      }
    });
    
    const vector = embedResult.embeddings?.[0]?.values || [];

    const db = getFirestore();
    const entryData = {
      ...parsedSummary,
      transcript: transcript,
      embedding: FieldValue.vector(vector),
      createdAt: FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('users').doc(uid).collection('entries').add(entryData);

    res.json({ success: true, id: docRef.id, ...entryData, embedding: vector });
  } catch (error: any) {
    console.error('Archive Error:', error);
    res.status(500).json({ error: error.message || 'Failed to bind the pages to the archive.' });
  }
});
`;
code = code.replace(summarizeRouteRegex, newSummarize);

const omitRouteRegex = /app\.patch\('\/api\/journal\/entries\/:id\/omit', verifyAuth, async \(req, res\) => \{[\s\S]*?\}\);\n/g;

const newOmit = `app.patch('/api/journal/entries/:id/omit', verifyAuth, async (req, res) => {
  try {
    const uid = (req as any).uid;
    const { id } = req.params;
    const { messageIndex } = req.body;
    
    if (typeof messageIndex !== 'number') {
      return res.status(400).json({ error: "Invalid messageIndex" });
    }

    const db = getFirestore();
    const docRef = db.collection('users').doc(uid).collection('entries').doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return res.status(404).json({ error: "Entry not found" });
    }

    const data = docSnap.data();
    let transcript = data?.transcript || [];
    if (typeof transcript === 'string') {
      try { transcript = JSON.parse(transcript); } catch (e) { transcript = []; }
    }
    
    if (!Array.isArray(transcript) || transcript.length === 0 || messageIndex < 0 || messageIndex >= transcript.length) {
      return res.status(400).json({ error: "Invalid transcript or index" });
    }

    const targetMessage = transcript[messageIndex];
    if (targetMessage.role === 'user') {
      transcript.splice(messageIndex, 2);
    } else {
      let startIdx = messageIndex - 1;
      if (startIdx >= 0 && transcript[startIdx].role === 'user') {
        transcript.splice(startIdx, 2);
      } else {
        transcript.splice(messageIndex, 1);
      }
    }

    if (transcript.length === 0) {
      await docRef.delete();
      return res.json({ deleted: true });
    }

    // Regenerate Summary
    const transcriptString = transcript.map((msg: any) => 
      \`[\${msg.role === 'user' ? 'User' : 'AI'}]: \${msg.text || msg.content}\`
    ).join('\\n');

    const sumResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: \`Distill this journal transcript into a JSON object: {title, summary, mood, tags}. Maintain a scholarly, objective Dark Academia tone. CRITICAL: You MUST accurately capture all concrete factual events, physical objects, technical issues, and specific tools mentioned. Do not omit facts for philosophy.\\n\\n\${transcriptString}\`,
      config: { responseMimeType: "application/json" }
    });

    let parsedSummary;
    try {
      parsedSummary = JSON.parse(sumResponse.text?.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '') || '{}');
      if (!parsedSummary.title || !parsedSummary.summary) throw new Error("Missing");
    } catch (e) {
      parsedSummary = { title: "Archived Whisper", summary: "A quiet reflection.", mood: "calm", tags: ["reflection"] };
    }

    const embedResult = await ai.models.embedContent({
      model: 'text-embedding-005',
      contents: \`\${parsedSummary.title}: \${parsedSummary.summary}\`,
      config: { outputDimensionality: 768 }
    });
    
    const vector = embedResult.embeddings?.[0]?.values || [];
    
    const updatedData = {
      ...parsedSummary,
      transcript: transcript,
      embedding: FieldValue.vector(vector)
    };

    await docRef.update(updatedData);
    
    res.json({ id, ...data, ...updatedData, embedding: vector });
  } catch (error: any) {
    console.error('Omit Error:', error);
    res.status(500).json({ error: error.message || 'Failed to omit message.' });
  }
});
`;
code = code.replace(omitRouteRegex, newOmit);

const deleteRegex = /app\.delete\('\/api\/journal\/entries\/:id', verifyAuth, async \(req, res\) => \{[\s\S]*?\}\);\n/g;
const newDelete = `app.delete('/api/journal/entries/:id', verifyAuth, async (req, res) => {
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
});
`;
code = code.replace(deleteRegex, newDelete);


fs.writeFileSync('server.ts', code);
console.log('Restored backend DB logic in server.ts');
