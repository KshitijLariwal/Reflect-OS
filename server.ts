import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps, getApp, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = process.env.PORT || 3000;



// Initialize Firebase Admin
try {
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
  const formattedPrivateKey = rawKey
    ? (rawKey.includes('-----BEGIN PRIVATE KEY-----')
        ? rawKey.replace(/\\n/g, '\n')
        : Buffer.from(rawKey, 'base64').toString('utf-8'))
    : undefined;

  const serviceAccount = formattedPrivateKey ? {
    projectId: process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0610859138',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: formattedPrivateKey,
  } : undefined;

  initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0610859138'
  });
  console.log("Firebase Admin initialized successfully.");
} catch (error) {
  console.error("Firebase Admin initialization failed. Server will continue to start to serve health checks, but Firebase features will fail:", error);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(express.json({ limit: '50mb' }));
app.use(express.json());


app.get('/api/health', (req, res) => {
  try {
    const firebaseStatus = getApps().length > 0 ? "Initialized" : "NOT Initialized";
    const projectId = getApps().length > 0 ? getApp().options.projectId : "Unknown";
    const geminiKey = process.env.GEMINI_API_KEY ? "Present" : "Missing";
    
    res.status(200).json({
      status: "Server is running",
      firebase: firebaseStatus,
      projectId: projectId,
      geminiKey: geminiKey,
      env: process.env.NODE_ENV
    });
  } catch (error: any) {
    res.status(500).send(`Health Check Failed: ${error.message}`);
  }
});


app.get('/api/test-db', async (req, res) => {
  try {
    const testDoc = getFirestore('ai-studio-reflectos-59ca32a0-9f51-499e-8eee-fda4f36aa976').collection('system_tests').doc('connection_check');
    await testDoc.set({ 
      timestamp: FieldValue.serverTimestamp(),
      status: 'success' 
    });
    
    res.status(200).json({ message: "FIRESTORE WRITE SUCCESSFUL. The bug is in Auth." });
  } catch (error: any) {
    console.error("Firestore Test Error:", error);
    res.status(500).json({ 
      message: "FIRESTORE WRITE FAILED. The database might not exist.",
      error: error.message 
    });
  }
});


// verifyAuth middleware
const verifyAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized: Missing or invalid Authorization header" });
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    (req as any).user = decodedToken;
    (req as any).uid = decodedToken.uid;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(403).json({ error: "Unauthorized: Invalid token or Firebase Admin not initialized" });
  }
};

app.get('/api/test-auth', verifyAuth, (req, res) => {
  res.json({ message: "Auth successful", uid: (req as any).uid });
});


// Example protected AI route
app.post('/api/journal/embed', verifyAuth, async (req, res) => {
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
      model: 'gemini-2.5-flash',
      contents: { parts: promptParts },
      config: {
        systemInstruction: "You are 'The Whispering Pages', a scholarly and intellectually grounded Dark Academia journaling AI. Maintain a refined, observant tone. CRITICAL: Do not force melancholy, brooding, or 'solace-seeking' narratives unless the user is explicitly in deep distress. If the user discusses technical concepts, architecture, or philosophy, engage as a sharp academic peer. Respond elegantly to the user's message. Also provide a single-sentence philosophical observation about the user's state of mind, 4 hex colors reflecting the mood, and 4 short concepts. " + (pastContext ? "\n\nTEMPORAL ECHOES (Past context): \n" + pastContext + "\n\nCRITICAL RULE: If your response uses ANY information from a Temporal Echo, you MUST append this exact markdown link at the very end of your response: `[Erase this echo](forget:{ID})` replacing {ID} with the Memory ID." : ""),
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
});

app.post('/api/journal/summarize', verifyAuth, async (req, res) => {
  try {
    const uid = (req as any).uid;
    const { transcript } = req.body;
    
    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return res.status(400).json({ error: "No whispers to archive." });
    }

    const transcriptString = transcript.map((msg: any) => 
      `[${msg.role === 'user' ? 'User' : 'AI'}]: ${msg.text || msg.content}`
    ).join('\n');

    let response;
    try {
      let attempts = 0;
      while (attempts < 3) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Distill this journal transcript into a JSON object: {title, summary, mood, tags}. Maintain a scholarly, objective Dark Academia tone. CRITICAL: You MUST accurately capture all concrete factual events, physical objects, technical issues, and specific tools mentioned (e.g. Go, goroutines, databases). Do not omit facts for philosophy.\n\n${transcriptString}`,
            config: {
              responseMimeType: "application/json"
            }
          });
          break;
        } catch (e: any) {
          attempts++;
          if (attempts >= 3 || e.status !== 'RESOURCE_EXHAUSTED') throw e;
          await new Promise(r => setTimeout(r, 2000 * attempts));
        }
      }
    } catch (apiError: any) {
      console.error("Gemini API Error during summarization:", apiError);
      return res.status(500).json({ error: "Failed to generate summary from AI", details: apiError.message });
    }

    let parsedSummary;
    try {
      parsedSummary = JSON.parse(response.text?.replace(/```json/g, '').replace(/```/g, '') || '{}');
      if (!parsedSummary.title || !parsedSummary.summary) {
        throw new Error("Missing required summary fields");
      }
    } catch (e) {
      parsedSummary = { title: "Archived Whisper", summary: "A quiet reflection.", mood: "calm", tags: ["reflection"] };
    }

    let embedResult;
    let embedAttempts = 0;
    while (embedAttempts < 3) {
      try {
        embedResult = await ai.models.embedContent({
          model: 'gemini-embedding-2',
          contents: `${parsedSummary.title}: ${parsedSummary.summary}`,
          config: {
            outputDimensionality: 768
          }
        });
        break;
      } catch (e: any) {
        embedAttempts++;
        if (embedAttempts >= 3 || e.status !== 'RESOURCE_EXHAUSTED') throw e;
        await new Promise(r => setTimeout(r, 2000 * embedAttempts));
      }
    }
    
    const vector = embedResult.embeddings?.[0]?.values || [];

    res.json({ success: true, summary: parsedSummary, transcript: transcript, vector: vector });
  } catch (error: any) {
    console.error('Archive Error:', error);
    res.status(500).json({ error: error.message || 'Failed to bind the pages to the archive.' });
  }
});

// Archive route replaced by client-side direct access to Firestore.


app.post('/api/vision/scan', verifyAuth, async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: "No image provided." });

    const mimeType = imageBase64.split(';')[0].split(':')[1];
    const base64Data = imageBase64.split(',')[1];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { text: "Act as an advanced OCR and Lens scanner. If there is text or handwriting in this image, transcribe it perfectly. If it is a scene or object, describe it poetically in one sentence. Do not include markdown or formatting, just return the raw text." },
          { inlineData: { data: base64Data, mimeType: mimeType } }
        ]
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Vision API Error:", error);
    res.status(500).json({ error: error.message || "The ink is too faded to read." });
  }
});

async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

setupVite();
