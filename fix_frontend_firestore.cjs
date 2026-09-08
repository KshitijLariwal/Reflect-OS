const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Update imports
code = code.replace(
  "import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp, vector } from 'firebase/firestore';",
  "import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp, vector, doc, deleteDoc, updateDoc } from 'firebase/firestore';"
);

// Fix forgetMemory
const oldForget = `  const forgetMemory = async (id: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch(\`/api/journal/entries/\${id}\`, {
        method: 'DELETE',
        headers: {
          'Authorization': \`Bearer \${token}\`
        }
      });
      if (response.ok) {
        setChatHistory(prev => [...prev, { role: 'system', content: 'The pages have been burned. This memory will no longer echo.' }]);
      }
    } catch (err) {
      console.error('Failed to forget memory', err);
    }
  };`;
const newForget = `  const forgetMemory = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'entries', id));
      setChatHistory(prev => [...prev, { role: 'system', content: 'The pages have been burned. This memory will no longer echo.' }]);
    } catch (err) {
      console.error('Failed to forget memory', err);
    }
  };`;
code = code.replace(oldForget, newForget);

// Fix deleteEntry
const oldDeleteEntry = `  const deleteEntry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch(\`/api/journal/entries/\${id}\`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        }
      });
      if (response.ok) {
        setArchivesData(prev => prev.filter(entry => entry.id !== id));
        // If the currently viewed entry is deleted, close it
        if (selectedEntry?.id === id) {
          setSelectedEntry(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete entry', err);
    }
  };`;
const newDeleteEntry = `  const deleteEntry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'entries', id));
      setArchivesData(prev => prev.filter(entry => entry.id !== id));
      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
      }
    } catch (err) {
      console.error('Failed to delete entry', err);
    }
  };`;
code = code.replace(oldDeleteEntry, newDeleteEntry);

// Fix removeMessage
const oldRemoveMessage = `  const removeMessage = async (entryId: string, messageIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    setIsRewritingMemory(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(\`/api/journal/entries/\${entryId}/omit\`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({ messageIndex })
      });
      const data = await response.json();
      if (response.ok) {
        if (data.deleted) {
          setArchivesData(prev => prev.filter(e => e.id !== entryId));
          setSelectedEntry(null);
        } else if (data.entry) {
          setArchivesData(prev => prev.map(e => e.id === entryId ? data.entry : e));
          setSelectedEntry(data.entry);
        }
      }
    } catch (err) {
      console.error('Failed to omit message:', err);
    } finally {
      setIsRewritingMemory(false);
    }
  };`;

const newRemoveMessage = `  const removeMessage = async (entryId: string, messageIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    // Find entry
    const entry = archivesData.find(e => e.id === entryId);
    if (!entry) return;
    
    setIsRewritingMemory(true);
    try {
      let currentTranscript = entry.transcript;
      if (typeof currentTranscript === 'string') {
        currentTranscript = JSON.parse(currentTranscript);
      }
      if (!Array.isArray(currentTranscript)) throw new Error('Transcript is invalid');
      
      const newTranscript = [...currentTranscript];
      newTranscript.splice(messageIndex, 1);
      
      if (newTranscript.length === 0) {
        await deleteDoc(doc(db, 'users', user.uid, 'entries', entryId));
        setArchivesData(prev => prev.filter(e => e.id !== entryId));
        setSelectedEntry(null);
      } else {
        const token = await user.getIdToken();
        const response = await fetch('/api/journal/summarize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`
          },
          body: JSON.stringify({ transcript: newTranscript })
        });
        
        const data = await response.json();
        if (data.success) {
          const updatedData = {
            ...data.summary,
            transcript: data.transcript,
            embedding: vector(data.vector)
          };
          
          await updateDoc(doc(db, 'users', user.uid, 'entries', entryId), updatedData);
          
          const newEntry = { id: entryId, ...entry, ...updatedData };
          setArchivesData(prev => prev.map(e => e.id === entryId ? newEntry : e));
          setSelectedEntry(newEntry);
        }
      }
    } catch (err) {
      console.error('Failed to omit message:', err);
    } finally {
      setIsRewritingMemory(false);
    }
  };`;
code = code.replace(oldRemoveMessage, newRemoveMessage);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx client-side db operations injected');
