const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const oldArchive = `  const handleArchiveAndClear = () => {
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

const newArchive = `  const handleArchiveAndClear = () => {
    if (chatHistory.length === 0) return; 
    
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // OPTIMISTIC UI: Instantly clear prompt & close menu
    const transcriptToArchive = [...chatHistory];
    setChatHistory([]);
    setIsFeatureMenuOpen(false);
    console.log("Optimistically bound to memory.");

    // FIRE AND FORGET: Background processing
    void (async () => {
      try {
        const token = await currentUser.getIdToken(true); 
        const response = await fetch('/api/journal/summarize', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`
          },
          body: JSON.stringify({ transcript: transcriptToArchive })
        });
        
        if (!response.ok) throw new Error("Backend failed");

        const data = await response.json();
        
        const entryData = {
          title: data.summary.title || "Echoes in the Dark",
          summary: data.summary.summary || "A transient thought.",
          mood: data.summary.mood || "CONTEMPLATIVE",
          tags: data.summary.tags || ["Fragment"],
          transcript: data.transcript,
          embedding: vector(data.vector || []),
          createdAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'entries'), entryData);
        console.log("Background sync complete:", docRef.id);
        
        setMoodData({
          insight: data.summary.insight || 'The spirit, poised at the threshold of expression, seeks its proper channel.',
          colors: data.summary.colors || ['#e2e8f0', '#fef08a', '#fdf8ff', '#f1f5f9'],
          concepts: data.summary.concepts || ['Anticipation', 'New Beginning', 'Reflection', 'Silence']
        });
      } catch (error: any) {
        console.error("Background archive failed gracefully:", error);
      }
    })();
  };`;

if(app.includes('const handleArchiveAndClear = async () => {')) {
  const startIndex = app.indexOf('  const handleArchiveAndClear = async () => {');
  const endIndex = app.indexOf('  const handleSendMessage = async () => {');
  app = app.substring(0, startIndex) + newArchive + '\n' + app.substring(endIndex);
}

const deleteRegex = /setTimeout\(async \(\) => \{[\s\S]*?\}, 800\);/;
app = app.replace(deleteRegex, `setTimeout(() => {
      const docRef = doc(db, 'users', user.uid, 'entries', id);
      setArchivesData(prev => prev.filter(item => item.id !== id));
      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
      }
      setDeletingIds(prev => prev.filter(delId => delId !== id));
      
      // Background unawaited deletion
      void deleteDoc(docRef).catch(err => console.error('Background delete failed', err));
    }, 250);`);

const removeRegex = /setTimeout\(async \(\) => \{[\s\S]*?\}, 1000\);/;
app = app.replace(removeRegex, `setTimeout(() => {
      setBurningMessages(prev => prev.filter(idx => idx !== messageIndex));
      setIsRewritingMemory(false);
      
      const transcript = [...selectedEntry.transcript];
      const targetMessage = transcript[messageIndex];
      if (targetMessage && targetMessage.role === 'user') {
        let count = 1;
        if (messageIndex + 1 < transcript.length && transcript[messageIndex + 1].role !== 'user') count = 2;
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
        setArchivesData(prev => prev.filter(item => item.id !== entryId));
        setSelectedEntry(null);
        void deleteDoc(docRef);
        return;
      }

      const updatedEntry = { ...selectedEntry, transcript };
      setSelectedEntry(updatedEntry);
      setArchivesData(prev => prev.map(item => item.id === entryId ? updatedEntry : item));

      // Background network sync
      void (async () => {
        try {
          await updateDoc(docRef, { transcript });
          const token = await user.getIdToken();
          const response = await fetch('/api/journal/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
            body: JSON.stringify({ transcript })
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              const freshData = { transcript: data.transcript, embedding: vector(data.vector), ...data.summary };
              await updateDoc(docRef, freshData);
            }
          }
        } catch (err) {
          console.error('Background re-summarize failed', err);
        }
      })();
    }, 250);`);

fs.writeFileSync('src/App.tsx', app);
console.log("Frontend optimistic UI and 250ms timings updated");
