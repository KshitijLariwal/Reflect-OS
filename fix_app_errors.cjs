const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldArchive = `const handleArchiveAndClear = async () => {
    if (!user) { alert("Auth error: Please log in."); return; }
    if (chatHistory.length === 0) { alert("No messages to archive."); return; }
    if (isArchiving) return;
    setIsArchiving(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/journal/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({ transcript: chatHistory })
      });`;

const newArchive = `const handleArchiveAndClear = async () => {
    if (!user) { alert("Auth error: Please log in."); return; }
    if (chatHistory.length === 0) { alert("No messages to archive."); return; }
    if (isArchiving) return;
    setIsArchiving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("You must be logged in.");
      const response = await fetch('/api/journal/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({ transcript: chatHistory })
      });`;

code = code.replace(oldArchive, newArchive);
fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated');
