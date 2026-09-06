import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  const imagePath = 'public/image.png';
  if (!fs.existsSync(imagePath)) {
    console.log("No image.png found.");
    return;
  }
  const imageBytes = fs.readFileSync(imagePath);
  const base64Image = imageBytes.toString('base64');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: [
      { text: 'Describe the UI in this image in extreme detail. It is a desktop UI. Provide a detailed breakdown of the layout (sidebar, main chat area, colors, font styles, specific text like headers, buttons). I need to rebuild this exactly in React and Tailwind.' },
      { inlineData: { data: base64Image, mimeType: 'image/png' } }
    ],
  });
  console.log(response.text);
}
run();
