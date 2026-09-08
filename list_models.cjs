const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  const models = ['gemini-embedding-2', 'gemini-embedding-001'];
  for (const model of models) {
    try {
      const response = await ai.models.embedContent({
        model: model,
        contents: 'Hello world',
        config: { outputDimensionality: 768 }
      });
      console.log(model, "SUCCESS");
    } catch (e) {
      console.log(model, "FAILED", e.message);
    }
  }
}
run().catch(console.error);
