const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const cosineFunc = `
function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
`;

const oldHandleSend = `  const handleSendMessage = async () => {
    if (!message.trim() || !user || isSending) return;

    const userMessage = message;
    setMessage('');
    setIsSending(true);
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({ message: userMessage })
      });`;

const newHandleSend = `  const handleSendMessage = async () => {
    if (!message.trim() || !user || isSending) return;

    const userMessage = message;
    setMessage('');
    setIsSending(true);
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const token = await user.getIdToken();
      
      // 1. Get embedding for the user message
      let queryVector: number[] = [];
      let pastContext = "";
      try {
        const embedRes = await fetch('/api/journal/embed', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`
          },
          body: JSON.stringify({ text: userMessage })
        });
        if (embedRes.ok) {
          const embedData = await embedRes.json();
          queryVector = embedData.vector || [];
        }
      } catch (e) {
        console.error("Failed to get embedding:", e);
      }

      // 2. Local Vector Search
      if (queryVector.length > 0) {
        try {
          const entriesSnap = await getDocs(collection(db, 'users', user.uid, 'entries'));
          const scoredEntries = entriesSnap.docs.map(doc => {
            const data = doc.data();
            // Assuming data.embedding is an object like { values: [...] } from FieldValue.vector, or just an array
            let vec: number[] = [];
            if (Array.isArray(data.embedding)) vec = data.embedding;
            else if (data.embedding?.values) vec = data.embedding.values;
            else if (data.embedding?.value) vec = data.embedding.value; // Sometimes it's structured this way
            
            const score = vec.length === queryVector.length ? cosineSimilarity(queryVector, vec) : -1;
            return { id: doc.id, summary: data.summary, score };
          });
          
          scoredEntries.sort((a, b) => b.score - a.score);
          const topEntries = scoredEntries.filter(e => e.score > 0.5).slice(0, 2);
          
          if (topEntries.length > 0) {
            pastContext = topEntries.map(e => "Memory ID [" + e.id + "]: " + e.summary).join(" | ");
          }
        } catch (e) {
          console.error("Local vector search failed:", e);
        }
      }

      // 3. Send to Chat Backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({ message: userMessage, pastContext })
      });`;

code = code.replace(oldHandleSend, newHandleSend);
if (!code.includes('function cosineSimilarity')) {
  code = code.replace('export default function App() {', cosineFunc + '\nexport default function App() {');
}

fs.writeFileSync('src/App.tsx', code);
console.log("Updated App.tsx with local vector search");
