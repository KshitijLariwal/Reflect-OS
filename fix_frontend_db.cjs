const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldDeleteEntry = `const deleteEntry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
        setArchivesData(prev => prev.filter(item => item.id !== id));
        if (selectedEntry?.id === id) {
          setSelectedEntry(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete entry', err);
    }
  };`;

const newDeleteEntry = `const deleteEntry = async (id: string, e: React.MouseEvent) => {
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
  
code = code.replace(oldDeleteEntry, newDeleteEntry);

const oldRemoveMessageRegex = /const removeMessage = async \(entryId: string, messageIndex: number, e: React\.MouseEvent\) => \{[\s\S]*?finally \{\n      setIsRewritingMemory\(false\);\n    \}\n  \};/;

const newRemoveMessage = `const removeMessage = async (entryId: string, messageIndex: number, e: React.MouseEvent) => {
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

code = code.replace(oldRemoveMessageRegex, newRemoveMessage);

fs.writeFileSync('src/App.tsx', code);
console.log('Migrated DB calls to client SDK in App.tsx');
