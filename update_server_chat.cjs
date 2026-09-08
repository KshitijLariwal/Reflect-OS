const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldChatStart = code.indexOf("app.post('/api/chat', verifyAuth, async (req, res) => {");
const oldChatEnd = code.indexOf("app.post('/api/journal/summarize'") - 1;

if (oldChatStart !== -1 && oldChatEnd !== -1) {
  const newChat = `app.post('/api/journal/embed', verifyAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });
    
    const embeddingResponse = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: text,
      config: { outputDimensionality: 768 }
    });
    
    const vector = embeddingResponse.embeddings?.[0]?.values || [];
    res.json({ vector });
  } catch (error: any) {
    console.error("Embed Error:", error);
    res.status(500).json({ error: error.message || 'Failed to embed' });
  }
});

app.post('/api/chat', verifyAuth, async (req, res) => {
  try {
    const uid = (req as any).uid;
    const { message, imageBase64, pastContext } = req.body;
    
    if (!message && !imageBase64) {
      return res.status(400).json({ error: 'Message or image is required' });
    }

    const promptParts: any[] = [];
    if (message) {
      promptParts.push({ text: message });
    }
    if (imageBase64) {
      const mimeType = imageBase64.split(';')[0].split(':')[1];
      const base64Data = imageBase64.split(',')[1];
      promptParts.push({
        inlineData: { data: base64Data, mimeType: mimeType }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: { parts: promptParts },
      config: {
        systemInstruction: "You are 'The Whispering Pages', a scholarly and intellectually grounded Dark Academia journaling AI. Maintain a refined, observant tone. CRITICAL: Do not force melancholy, brooding, or 'solace-seeking' narratives unless the user is explicitly in deep distress. If the user discusses technical concepts, architecture, or philosophy, engage as a sharp academic peer. Respond elegantly to the user's message. Also provide a single-sentence philosophical observation about the user's state of mind, 4 hex colors reflecting the mood, and 4 short concepts. " + (pastContext ? "\\n\\nTEMPORAL ECHOES (Past context): \\n" + pastContext + "\\n\\nCRITICAL RULE: If your response uses ANY information from a Temporal Echo, you MUST append this exact markdown link at the very end of your response: \`[Erase this echo](forget:{ID})\` replacing {ID} with the Memory ID." : ""),
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            reply: { type: "STRING" },
            insight: { type: "STRING", description: "A single poetic, philosophical sentence observing the user's state of mind or underlying theme." },
            colors: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "Array of exactly 4 hex color codes (e.g. '#1a362d') representing the mood of the conversation."
            },
            concepts: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "Array of exactly 4 short concepts (1-2 words max) derived from the conversation."
            }
          },
          required: ["reply", "insight", "colors", "concepts"]
        }
      }
    });

    try {
      const parsedResponse = JSON.parse(response.text || '{}');
      res.json({ 
        reply: parsedResponse.reply || response.text, 
        insight: parsedResponse.insight,
        colors: parsedResponse.colors,
        concepts: parsedResponse.concepts,
        uid 
      });
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw Response:", response.text);
      res.json({ reply: response.text, insight: "The ink runs in unpredictable ways.", colors: ["#2c2822", "#4a4238", "#d9a05b", "#143026"], concepts: ["Mystery", "Obscurity", "Ink", "Silence"], uid });
    }
  } catch (error: any) {
    console.error('Chat Error:', error);
    res.status(500).json({ error: error.message || 'Failed to process chat' });
  }
});\n`;

  code = code.substring(0, oldChatStart) + newChat + code.substring(oldChatEnd);
  fs.writeFileSync('server.ts', code);
  console.log("Updated server.ts for /api/chat");
} else {
  console.log("Could not find chat block");
}
