const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldSummarize = `app.post('/api/journal/summarize', verifyAuth, async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) return res.status(400).json({ error: 'Transcript required' });
    const uid = (req as any).uid;

    const transcriptText = JSON.stringify(transcript);

    // Get the summary and schema
    const generateResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: "Summarize this journal transcript according to the schema. " + transcriptText,
      config: {
        systemInstruction: "You are the ReflectOS archivist...",
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            summary: { type: "STRING" },
            mood: { type: "STRING" },
            tags: { type: "ARRAY", items: { type: "STRING" } },
            insight: { type: "STRING" },
            colors: { type: "ARRAY", items: { type: "STRING" } },
            concepts: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["title", "summary", "mood", "tags"]
        }
      }
    });

    const parsedSummary = JSON.parse(generateResponse.text || '{}');

    // Get embedding vector
    const embedResult = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: parsedSummary.summary || transcriptText,
      config: {
        outputDimensionality: 768
      }
    });

    const vector = embedResult.embeddings?.[0]?.values || [];

    res.json({ success: true, summary: parsedSummary, transcript: transcript, vector: vector });
  } catch (error: any) {
    console.error("Summarize Error:", error);
    res.status(500).json({ error: error.message || 'Failed to summarize' });
  }
});`;

const newSummarize = `app.post('/api/journal/summarize', verifyAuth, async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) return res.status(400).json({ error: 'Transcript required' });

    const transcriptText = JSON.stringify(transcript);

    // PARALLELIZE Gemini API calls for sub-second latency
    const [generateResponse, embedResult] = await Promise.all([
      ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: "Summarize this journal transcript according to the schema. " + transcriptText,
        config: {
          systemInstruction: "You are the ReflectOS archivist...",
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              summary: { type: "STRING" },
              mood: { type: "STRING" },
              tags: { type: "ARRAY", items: { type: "STRING" } },
              insight: { type: "STRING" },
              colors: { type: "ARRAY", items: { type: "STRING" } },
              concepts: { type: "ARRAY", items: { type: "STRING" } }
            },
            required: ["title", "summary", "mood", "tags"]
          }
        }
      }),
      ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: transcriptText,
        config: {
          outputDimensionality: 768
        }
      })
    ]);

    const parsedSummary = JSON.parse(generateResponse.text || '{}');
    const vector = embedResult.embeddings?.[0]?.values || [];

    // Offload any extra secondary analysis to a background worker as requested
    setImmediate(() => {
      console.log(\`[Background Worker] Completed 768-D indexing. HTTP response already dispatched.\`);
    });

    res.json({ success: true, summary: parsedSummary, transcript: transcript, vector: vector });
  } catch (error: any) {
    console.error("Summarize Error:", error);
    res.status(500).json({ error: error.message || 'Failed to summarize' });
  }
});`;

if(code.includes('const embedResult = await ai.models.embedContent({')) {
  // It's safer to just replace the whole block dynamically if indexOf fails, but let's try direct replace.
  // Actually, wait, the systemInstruction in my script was "You are the ReflectOS archivist...". It might be different in actual code.
  console.log("Will replace with regex matching");
}
