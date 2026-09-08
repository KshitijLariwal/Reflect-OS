const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldLogic = `  const handleArchiveAndClear = async () => {
    if (chatHistory.length === 0) { alert("No messages to archive."); return; }
    if (!user) { alert("Auth error: Please log in."); return; }
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
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorText;
        } catch (e) {
          // It's raw text/html
        }
        throw new Error(\`Server Error (\${response.status}): \${errorMessage}\`);
      }

      alert("Archive successfully bound to memory.");
      setChatHistory([]);
      setMoodData({
        insight: 'The spirit, poised at the threshold of expression, seeks its proper channel.',
        colors: ['#e2e8f0', '#fef08a', '#fdf8ff', '#f1f5f9'],
        concepts: ['Anticipation', 'New Beginning', 'Reflection', 'Silence']
      });
    } catch (err: any) {
      console.error("Archive flow error:", err);
      alert(\`Archive failed: \${err.message}\`);
    } finally {
      setIsArchiving(false);
    }
  };`;

const newLogic = `  const handleArchiveAndClear = async () => {
    if (chatHistory.length === 0) { 
      alert("No messages to archive."); 
      return; 
    }
    if (isArchiving) return;
    
    // Check if auth and currentUser exist
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("Auth Error: No active Firebase user found. Please refresh or re-authenticate.");
      console.error("auth.currentUser is null. Auth state:", auth);
      return;
    }

    setIsArchiving(true);
    try {
      console.log("Fetching ID token for user:", currentUser.uid);
      // Force a token refresh to ensure it's valid with the new reflectos-web project config
      const token = await currentUser.getIdToken(true); 
      if (!token) {
        throw new Error("Failed to generate a valid Firebase ID token.");
      }

      console.log("Token acquired, sending to backend...");
      const response = await fetch('/api/journal/summarize', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({ transcript: chatHistory })
      });
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || \`HTTP Status \${response.status}\`);
      }

      const data = await response.json();
      console.log("Archive saved successfully:", data);
      alert("Archive successfully bound to memory.");
      setChatHistory([]);
      setMoodData({
        insight: 'The spirit, poised at the threshold of expression, seeks its proper channel.',
        colors: ['#e2e8f0', '#fef08a', '#fdf8ff', '#f1f5f9'],
        concepts: ['Anticipation', 'New Beginning', 'Reflection', 'Silence']
      });
    } catch (error: any) {
      console.error("Archive failed explicitly:", error);
      alert(\`Archive failed: \${error.message}\`);
    } finally {
      setIsArchiving(false);
    }
  };`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/App.tsx', code);
console.log("App.tsx updated");
