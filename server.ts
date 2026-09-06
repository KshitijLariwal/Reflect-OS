import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = 3000;

// Initialize Firebase Admin
initializeApp({
  projectId: 'gen-lang-client-0610859138'
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(express.json({ limit: '50mb' }));

// verifyAuth middleware
const verifyAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    // Attach uid to req
    (req as any).uid = decodedToken.uid;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Example protected AI route
app.post('/api/chat', verifyAuth, async (req, res) => {
  try {
    const uid = (req as any).uid;
    const { message, imageBase64 } = req.body;
    
    // Ensure the user didn't send a completely empty request
    if (!message && !imageBase64) {
      return res.status(400).json({ error: 'Message or image is required' });
    }

    let pastContext = "";
    try {
      if (message) {
        const embeddingResponse = await ai.models.embedContent({
          model: 'gemini-embedding-2-preview',
          contents: message
        });
        const queryVector = embeddingResponse.embeddings?.[0]?.values || [];

        // EDGE CASE 3: Firestore Vector Search
        if (queryVector.length > 0) {
          const db = getFirestore();
          const entriesRef = db.collection('users').doc(uid).collection('entries');
          const vectorQuery = entriesRef.findNearest('embedding', FieldValue.vector(queryVector), {
            limit: 2,
            distanceMeasure: 'COSINE'
          });
          
          const snapshot = await vectorQuery.get();
          
          // EDGE CASE 4: Brand new user with empty database
          if (!snapshot.empty) {
            pastContext = "\n\nRelevant past reflections from this user: " + snapshot.docs.map(doc => doc.data().summary).join(" | ");
          }
        }
      }
    } catch (error) {
      console.error("Vector Search failed, continuing without context:", error);
      // Fail gracefully; do not break the chat if search fails
    }

    // Build the multimodal payload
    const promptParts: any[] = [];
    if (message) {
      promptParts.push({ text: message });
    }
    if (imageBase64) {
      // Extract mime type and base64 data from the Data URL
      const mimeType = imageBase64.split(';')[0].split(':')[1];
      const base64Data = imageBase64.split(',')[1];
      promptParts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: { parts: promptParts },
      config: {
        systemInstruction: `You are 'The Whispering Pages', a Dark Academia journaling AI. Respond elegantly to the user's message. Also provide a single-sentence philosophical observation about the user's state of mind, 4 hex colors reflecting the mood, and 4 short concepts.${pastContext}`,
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
      console.error('Failed to parse JSON response:', parseError);
      res.json({ reply: response.text, uid });
    }
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Quota exceeded') || error?.status === 'RESOURCE_EXHAUSTED') {
      return res.status(429).json({ error: "The whispers are too frequent. Please wait a moment before consulting the pages again." });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/api/journal/summarize', verifyAuth, async (req, res) => {
  try {
    const uid = (req as any).uid;
    const { transcript } = req.body;
    
    // EDGE CASE 1: Empty transcript
    if (!transcript || transcript.length === 0) {
      return res.status(400).json({ error: "No whispers to archive." });
    }

    const transcriptString = Array.isArray(transcript) ? JSON.stringify(transcript) : transcript;

    // 1. Generate Summary
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `Distill this journal transcript into a raw JSON object: { "title": "string", "summary": "string", "mood": "string", "tags": ["string"] }\n\n${transcriptString}`,
      config: {
        responseMimeType: "application/json"
      }
    });

    let parsedSummary;
    
    // EDGE CASE 2: Malformed JSON from Gemini
    try {
      parsedSummary = JSON.parse(response.text?.replace(/```json/g, '').replace(/```/g, '') || '{}');
      if (!parsedSummary.title || !parsedSummary.summary) {
        throw new Error("Missing required summary fields");
      }
    } catch (e) {
      parsedSummary = { title: "Archived Whisper", summary: "A quiet reflection.", mood: "calm", tags: ["reflection"] };
    }

    // 2. Generate Vector Embedding
    const embedResult = await ai.models.embedContent({
      model: 'gemini-embedding-2-preview',
      contents: `${parsedSummary.title}: ${parsedSummary.summary}`
    });
    
    const vector = embedResult.embeddings?.[0]?.values || [];

    // 3. Save to Firestore
    const db = getFirestore();
    const entryRef = db.collection('users').doc(uid).collection('entries').doc();
    await entryRef.set({
      ...parsedSummary,
      transcript: transcriptString,
      embedding: FieldValue.vector(vector),
      createdAt: FieldValue.serverTimestamp()
    });

    res.json({ success: true, entryId: entryRef.id });
  } catch (error: any) {
    console.error('Archive Error:', error);
    res.status(500).json({ error: 'Failed to bind the pages to the archive.' });
  }
});

app.get('/api/journal/entries', verifyAuth, async (req, res) => {
  try {
    const uid = (req as any).uid;
    const db = getFirestore();
    const snapshot = await db.collection('users').doc(uid).collection('entries')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
      
    const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Remove the heavy vectors and transcripts before sending to frontend
    const safeEntries = entries.map(({ embedding, transcript, ...rest }) => rest);
    res.json(safeEntries);
  } catch (error) {
    console.error("Fetch Entries Error:", error);
    res.status(500).json({ error: "Could not dust off the archives." });
  }
});

app.post('/api/vision/scan', verifyAuth, async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: "No image provided." });

    const mimeType = imageBase64.split(';')[0].split(':')[1];
    const base64Data = imageBase64.split(',')[1];

    // Acting as Google Lens/OCR
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: {
        parts: [
          { text: "Act as an advanced OCR and Lens scanner. If there is text or handwriting in this image, transcribe it perfectly. If it is a scene or object, describe it poetically in one sentence. Do not include markdown or formatting, just return the raw text." },
          { inlineData: { data: base64Data, mimeType: mimeType } }
        ]
      }
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error("Vision API Error:", error);
    res.status(500).json({ error: "The ink is too faded to read." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Note: Use *all for Express v5, but we are using express 4.21.2 based on package.json
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
