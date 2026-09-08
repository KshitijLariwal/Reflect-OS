const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Switch back to purely Client-Side driven saving
const newArchive = `  const handleArchiveAndClear = async () => {
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
      
      // FIX: Write directly from the frontend to bypass backend IAM permissions
      const entryData = {
        title: data.summary.title,
        summary: data.summary.summary,
        mood: data.summary.mood,
        tags: data.summary.tags,
        transcript: data.transcript,
        embedding: vector(data.vector),
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'entries'), entryData);
      
      console.log("Archive saved successfully to frontend DB:", docRef.id);
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
  
code = code.replace(/const handleArchiveAndClear = async \(\) => \{[\s\S]*?\}\s*?\};\s*\n/, newArchive + '\n');

const newOmit = `const removeMessage = async (entryId: string, messageIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !selectedEntry) return;
    
    setIsRewritingMemory(true);
    try {
      let transcript = [...(selectedEntry.transcript || [])];
      
      const targetMessage = transcript[messageIndex];
      if (targetMessage && targetMessage.role === 'user') {
        let count = 1;
        if (messageIndex + 1 < transcript.length && transcript[messageIndex + 1].role !== 'user') {
          count = 2;
        }
        transcript.splice(messageIndex, count);
      } else if (targetMessage && targetMessage.role !== 'user') {
        let startIdx = messageIndex;
        let count = 1;
        if (messageIndex - 1 >= 0 && transcript[messageIndex - 1].role === 'user') {
          startIdx = messageIndex - 1;
          count = 2;
        }
        transcript.splice(startIdx, count);
      }

      const docRef = doc(db, 'users', user.uid, 'entries', entryId);

      if (transcript.length === 0) {
        await deleteDoc(docRef);
        setArchivesData(prev => prev.filter(item => item.id !== entryId));
        setSelectedEntry(null);
        return;
      }

      const token = await user.getIdToken();
      // Only call the backend to get the fresh summary and embedding vector
      const response = await fetch('/api/journal/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({ transcript })
      });
      
      if (!response.ok) {
        console.error(await response.text());
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        const updatedData = {
          ...data.summary,
          transcript: data.transcript,
          embedding: vector(data.vector)
        };
        
        // Push update directly from frontend client SDK
        await updateDoc(docRef, updatedData);
        
        const updatedEntry = { id: entryId, ...updatedData, createdAt: selectedEntry.createdAt } as any;
        setArchivesData(prev => prev.map(item => item.id === entryId ? updatedEntry : item));
        setSelectedEntry(updatedEntry);
      }

    } catch (err) {
      console.error('Failed to omit message:', err);
    } finally {
      setIsRewritingMemory(false);
    }
  };`;
  
code = code.replace(/const removeMessage = async \(entryId: string, messageIndex: number, e: React\.MouseEvent\) => \{[\s\S]*?finally \{\n      setIsRewritingMemory\(false\);\n    \}\n  \};\n/, newOmit + '\n');


const newDelete = `const deleteEntry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid, 'entries', id);
      await deleteDoc(docRef);
      setArchivesData(prev => prev.filter(item => item.id !== id));
      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
      }
    } catch (err) {
      console.error('Failed to delete entry', err);
    }
  };`;

code = code.replace(/const deleteEntry = async \(id: string, e: React\.MouseEvent\) => \{[\s\S]*?console\.error\('Failed to delete entry', err\);\n    \}\n  \};\n/, newDelete + '\n');


fs.writeFileSync('src/App.tsx', code);
console.log("Restored frontend-driven Firebase architecture");
