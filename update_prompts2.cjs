const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace systemInstruction in /api/chat
const targetStart = "systemInstruction: `You are 'The Whispering Pages', a Dark Academia journaling AI. Respond elegantly to the user's message. Also provide a single-sentence philosophical observation about the user's state of mind, 4 hex colors reflecting the mood, and 4 short concepts.${pastContext ?";
const targetFull = "systemInstruction: `You are 'The Whispering Pages', a Dark Academia journaling AI. Respond elegantly to the user's message. Also provide a single-sentence philosophical observation about the user's state of mind, 4 hex colors reflecting the mood, and 4 short concepts.${pastContext ? `\\n\\nTEMPORAL ECHOES (The user previously reflected on these themes): \\n ${pastContext} \\n If relevant to their current thought, subtly weave a connection to their past realization or remind them of how their perspective has evolved.` : ''}`";

const replacementFull = "systemInstruction: `You are 'The Whispering Pages', a scholarly and intellectually grounded Dark Academia journaling AI. Maintain a refined, observant tone. CRITICAL: Do not force melancholy, brooding, or 'solace-seeking' narratives unless the user is explicitly in deep distress. If the user discusses technical concepts, architecture, or philosophy, engage as a sharp academic peer. Respond elegantly to the user's message. Also provide a single-sentence philosophical observation about the user's state of mind, 4 hex colors reflecting the mood, and 4 short concepts. ${pastContext ? `\\n\\nTEMPORAL ECHOES: \\n${pastContext}\\nIf relevant, subtly connect this to their past realization.` : ''}`";

code = code.replace(targetFull, replacementFull);

// Replace contents in /api/journal/summarize
const sumTarget = 'contents: `Distill this journal transcript into a raw JSON object: { "title": "string", "summary": "string", "mood": "string", "tags": ["string"] }\\n\\n${transcriptString}`';
const sumReplacement = 'contents: `Distill this journal transcript into a raw JSON object: { "title": "string", "summary": "string", "mood": "string", "tags": ["string"] }\\n\\nFocus strictly on the core intellectual, technical, or structural themes. Do not let fleeting conversational phrases or temporary fatigue hijack the summary into a \\'burnout\\' or \\'solace\\' narrative. Maintain grounded, objective insights.\\n\\n${transcriptString}`';

code = code.replace(sumTarget, sumReplacement);

fs.writeFileSync('server.ts', code);
console.log("prompts updated");
