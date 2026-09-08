const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace the generateContent block
const oldGen = `    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: \`Distill this journal transcript into a JSON object: {title, summary, mood, tags}. Maintain a scholarly, objective Dark Academia tone. CRITICAL: You MUST accurately capture all concrete factual events, physical objects, technical issues, and specific tools mentioned (e.g. Go, goroutines, databases). Do not omit facts for philosophy.\\n\\n\${transcriptString}\`,
        config: {
          responseMimeType: "application/json"
        }
      });
    } catch (apiError: any) {
      console.error("Gemini API Error during summarization:", apiError);
      return res.status(500).json({ error: "Failed to generate summary from AI", details: apiError.message });
    }`;

const newGen = `    let response;
    try {
      let attempts = 0;
      while (attempts < 3) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: \`Distill this journal transcript into a JSON object: {title, summary, mood, tags}. Maintain a scholarly, objective Dark Academia tone. CRITICAL: You MUST accurately capture all concrete factual events, physical objects, technical issues, and specific tools mentioned (e.g. Go, goroutines, databases). Do not omit facts for philosophy.\\n\\n\${transcriptString}\`,
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
    }`;

code = code.replace(oldGen, newGen);

// Add retry for embedding as well
const oldEmbed = `    const embedResult = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: \`\${parsedSummary.title}: \${parsedSummary.summary}\`,
      config: {
        outputDimensionality: 768
      }
    });`;

const newEmbed = `    let embedResult;
    let embedAttempts = 0;
    while (embedAttempts < 3) {
      try {
        embedResult = await ai.models.embedContent({
          model: 'gemini-embedding-2',
          contents: \`\${parsedSummary.title}: \${parsedSummary.summary}\`,
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
    }`;

code = code.replace(oldEmbed, newEmbed);

fs.writeFileSync('server.ts', code);
console.log("Added retry logic to server.ts");
