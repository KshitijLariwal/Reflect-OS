const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const startIndex = code.indexOf("app.post('/api/journal/summarize', verifyAuth, async (req, res) => {");
const endIndex = code.indexOf("// Archive route replaced by client-side direct access to Firestore.");

const newEndpoint = `app.post('/api/journal/summarize', verifyAuth, async (req, res) => {
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

if (startIndex !== -1 && endIndex !== -1) {
    code = code.substring(0, startIndex) + newEndpoint + code.substring(endIndex);
    fs.writeFileSync('server.ts', code);
    console.log("Replaced");
} else {
    console.log("Could not find indices:", startIndex, endIndex);
}
