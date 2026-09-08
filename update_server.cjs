const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Ensure express.json is at top (it's already there but let's make sure)
if (!code.includes('app.use(express.json());')) {
    code = code.replace("app.use(express.json({ limit: '50mb' }));", "app.use(express.json({ limit: '50mb' }));\napp.use(express.json());");
}

// 1. Update Summarize Route
const summarizeRouteRegex = /app\.post\('\/api\/journal\/summarize', verifyAuth, async \(req, res\) => \{[\s\S]*?\}\);\n/g;

const summarizeRouteReplacement = `app.post('/api/journal/summarize', verifyAuth, async (req, res) => {
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
        contents: \`Distill this journal transcript into a JSON object: {title, summary, mood, tags}. Maintain a scholarly, objective Dark Academia tone. CRITICAL: You MUST accurately capture all concrete factual events, physical objects, technical issues, and specific tools mentioned. Do not omit facts for philosophy.\\n\\n\${transcriptString}\`,
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

    res.json({ success: true, summary: parsedSummary, transcript: transcript, vector: vector });
  } catch (error: any) {
    console.error('Archive Error:', error);
    res.status(500).json({ error: 'Failed to bind the pages to the archive.', details: error.message, stack: error.stack });
  }
});
`;
code = code.replace(summarizeRouteRegex, summarizeRouteReplacement);

// 2. Update Chat Route System Instruction
const oldInstructionRegex = /systemInstruction: "You are 'The Whispering Pages'[\s\S]*?\),/g;
const newInstruction = `systemInstruction: "You are 'The Whispering Pages', a scholarly and intellectually grounded Dark Academia journaling AI. Maintain a refined, observant tone. CRITICAL: Do not force melancholy, brooding, or 'solace-seeking' narratives unless the user is explicitly in deep distress. If the user discusses technical concepts, architecture, or philosophy, engage as a sharp academic peer. Respond elegantly to the user's message. Also provide a single-sentence philosophical observation about the user's state of mind, 4 hex colors reflecting the mood, and 4 short concepts. " + (pastContext ? "\\n\\nTEMPORAL ECHOES (Past context): \\n" + pastContext + "\\n\\nCRITICAL RULE: If your response uses ANY information from a Temporal Echo, you MUST append this exact markdown link at the very end of your response: \`[Erase this echo](forget:{ID})\` replacing {ID} with the Memory ID." : ""),`;
code = code.replace(oldInstructionRegex, newInstruction);

// 3. Add PATCH Omit route
const omitRoute = `
app.patch('/api/journal/entries/:id/omit', verifyAuth, async (req, res) => {
  try {
    const uid = (req as any).uid;
    const { id } = req.params;
    const { messageIndex } = req.body;
    
    if (typeof messageIndex !== 'number') {
      return res.status(400).json({ error: "Invalid messageIndex" });
    }

    const db = getFirestore('ai-studio-reflectos-59ca32a0-9f51-499e-8eee-fda4f36aa976');
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
      let count = 1;
      if (messageIndex + 1 < transcript.length && transcript[messageIndex + 1].role !== 'user') {
        count = 2;
      }
      transcript.splice(messageIndex, count);
    } else {
      let startIdx = messageIndex;
      let count = 1;
      if (messageIndex - 1 >= 0 && transcript[messageIndex - 1].role === 'user') {
        startIdx = messageIndex - 1;
        count = 2;
      }
      transcript.splice(startIdx, count);
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
    res.status(500).json({ error: 'Failed to omit message.', details: error.message });
  }
});
`;

if (!code.includes('/api/journal/entries/:id/omit')) {
  // insert before app.post('/api/vision/scan'
  code = code.replace("app.post('/api/vision/scan'", omitRoute + "\napp.post('/api/vision/scan'");
}

fs.writeFileSync('server.ts', code);
console.log('server.ts updated');
