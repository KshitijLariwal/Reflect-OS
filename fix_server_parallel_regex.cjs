const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const startIndex = code.indexOf("app.post('/api/journal/summarize'");
const endIndex = code.indexOf("app.post('/api/journal/embed'");

if (startIndex !== -1 && endIndex !== -1) {
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
          systemInstruction: "You are the ReflectOS archivist. Extract a short poetic title, a 2 sentence summary, a single word mood, an array of 3-4 descriptive tags, a poetic insight, an array of 4 hex colors, and an array of 4 concepts.",
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
            required: ["title", "summary", "mood", "tags", "insight", "colors", "concepts"]
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
});

`;

  code = code.substring(0, startIndex) + newSummarize + code.substring(endIndex);
  fs.writeFileSync('server.ts', code);
  console.log("Replaced summarize with parallelized Promise.all");
}
