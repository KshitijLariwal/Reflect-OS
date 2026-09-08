const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const toReplace = `    }

    const db = getFirestore('ai-studio-reflectos-59ca32a0-9f51-499e-8eee-fda4f36aa976');
    const docRef = db.collection('users').doc(uid).collection('entries').doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return res.status(404).json({ error: "Entry not found" });
    }

    const data = docSnap.data();
    let transcript = data?.transcript || [];
    if (typeof transcript === 'string') {
      try { transcript = JSON.parse(transcript); } catch (e) { transcript = []; }
    }
    
    if (!Array.isArray(transcript) || transcript.length === 0 || messageIndex < 0 || messageIndex >= transcript.length) {
      return res.status(400).json({ error: "Invalid transcript or index" });
    }

    const targetMessage = transcript[messageIndex];
    if (targetMessage.role === 'user') {
      let count = 1;
      if (messageIndex + 1 < transcript.length && transcript[messageIndex + 1].role !== 'user') {
        count = 2;
      }
      transcript.splice(messageIndex, count);
    } else {
      let startIdx = messageIndex;
      let count = 1;
      if (messageIndex - 1 >= 0 && transcript[messageIndex - 1].role === 'user') {
        startIdx = messageIndex - 1;
        count = 2;
      }
      transcript.splice(startIdx, count);
    }

    if (transcript.length === 0) {
      await docRef.delete();
      return res.json({ deleted: true });
    }

    // Regenerate Summary
    const transcriptString = transcript.map((msg: any) => 
      \`[\${msg.role === 'user' ? 'User' : 'AI'}]: \${msg.text || msg.content}\`
    ).join('\\n');

    const sumResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: \`Distill this journal transcript into a JSON object: {title, summary, mood, tags}. Maintain a scholarly, objective Dark Academia tone. CRITICAL: You MUST accurately capture all concrete factual events, physical objects, technical issues, and specific tools mentioned. Do not omit facts for philosophy.\\n\\n\${transcriptString}\`,
      config: { responseMimeType: "application/json" }
    });

    let parsedSummary;
    try {
      parsedSummary = JSON.parse(sumResponse.text?.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '') || '{}');
      if (!parsedSummary.title || !parsedSummary.summary) throw new Error("Missing");
    } catch (e) {
      parsedSummary = { title: "Archived Whisper", summary: "A quiet reflection.", mood: "calm", tags: ["reflection"] };
    }

    const embedResult = await ai.models.embedContent({
      model: 'text-embedding-005',
      contents: \`\${parsedSummary.title}: \${parsedSummary.summary}\`,
      config: { outputDimensionality: 768 }
    });
    
    const vector = embedResult.embeddings?.[0]?.values || [];
    
    const updatedData = {
      ...parsedSummary,
      transcript: transcript,
      embedding: FieldValue.vector(vector)
    };

    await docRef.update(updatedData);
    
    res.json({ id, ...data, ...updatedData, embedding: vector });
  } catch (error: any) {
    console.error('Omit Error:', error);
    res.status(500).json({ error: error.message || 'Failed to omit message.' });
  }
});`;

code = code.replace(toReplace, "");
fs.writeFileSync('server.ts', code);
console.log('Fixed second duplicate');
