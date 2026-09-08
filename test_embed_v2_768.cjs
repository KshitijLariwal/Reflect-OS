const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  try {
    const embedResult = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: "Hello",
      config: {
        outputDimensionality: 768
      }
    });
    const vector = embedResult.embeddings?.[0]?.values || [];
    console.log("Vector length:", vector.length);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
test();
