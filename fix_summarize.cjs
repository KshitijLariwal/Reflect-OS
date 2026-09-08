const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetRegex = /app\.post\('\/api\/journal\/summarize', verifyAuth, async \(req, res\) => \{[\s\S]*?\}\);\n*/;

const newEndpoint = `app.post('/api/journal/summarize', verifyAuth, async (req, res) => {
  try {
    const uid = (req as any).uid;
    const { transcript } = req.body;
    
    // EDGE CASE 1: Empty transcript
    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return res.status(400).json({ error: "No whispers to archive." });
    }

    const transcriptString = transcript.map((msg: any) => 
      \`[\${msg.role === 'user' ? 'User' : 'AI'}]: \${msg.text || msg.content}\`
    ).join('\\n');

    let response;
    try {
      // 1. Generate Summary
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: \`Distill this journal transcript into a raw JSON object: { "title": "string", "summary": "string", "mood": "string", "tags": ["string"] }\\n\\nMaintain a scholarly, objective tone. DO NOT invent forced 'burnout' or 'melancholy' narratives. HOWEVER, you MUST accurately capture all concrete factual events, technical issues, and specific physical occurrences (e.g., hardware damage, specific tools used, life events) mentioned by the user. Do not omit factual details in the pursuit of abstraction.\\n\\n\${transcriptString}\`,
        config: {
          responseMimeType: "application/json"
        }
      });
    } catch (apiError: any) {
      console.error("Gemini API Error during summarization:", apiError);
      return res.status(500).json({ error: "Failed to generate summary from AI", details: apiError.message });
    }

    let parsedSummary;
    
    // EDGE CASE 2: Malformed JSON from Gemini
    try {
      parsedSummary = JSON.parse(response.text?.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '') || '{}');
      if (!parsedSummary.title || !parsedSummary.summary) {
        throw new Error("Missing required summary fields");
      }
    } catch (e) {
      parsedSummary = { title: "Archived Whisper", summary: "A quiet reflection.", mood: "calm", tags: ["reflection"] };
    }

    // 2. Generate Vector Embedding
    const embedResult = await ai.models.embedContent({
      model: 'text-embedding-005',
      contents: \`\${parsedSummary.title}: \${parsedSummary.summary}\`,
      config: {
        outputDimensionality: 768
      }
    });
    
    const vector = embedResult.embeddings?.[0]?.values || [];

    // Return the generated data so the frontend can securely save it using the Client SDK
    res.json({ success: true, summary: parsedSummary, transcript: transcript, vector: vector });
  } catch (error: any) {
    console.error('Archive Error:', error);
    res.status(500).json({ error: 'Failed to bind the pages to the archive.', details: error.message, stack: error.stack });
  }
});
`;

code = code.replace(targetRegex, newEndpoint);

fs.writeFileSync('server.ts', code);
console.log('Summarize endpoint updated');
