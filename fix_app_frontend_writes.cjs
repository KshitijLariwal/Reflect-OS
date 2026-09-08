const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldDeleteEntryStr = `    const deleteEntry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    // 1. Trigger Animation
    setDeletingIds(prev => [...prev, id]);
    
    // 2. Wait for animation to finish
    setTimeout(() => {
      const docRef = doc(db, 'users', user.uid, 'entries', id);
      setArchivesData(prev => prev.filter(item => item.id !== id));
      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
      }
      setDeletingIds(prev => prev.filter(delId => delId !== id));
      
      // Background backend deletion
      void (async () => {
        try {
          const token = await auth.currentUser?.getIdToken();
          await fetch(\`/api/journal/entries/\${id}\`, {
            method: 'DELETE',
            headers: { 'Authorization': \`Bearer \${token}\` }
          });
        } catch (err) {
          console.error('Background delete failed', err);
        }
      })();
    }, 800);
  };`;

const newDeleteEntryStr = `    const deleteEntry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    // 1. Trigger Animation
    setDeletingIds(prev => [...prev, id]);
    
    // 2. Wait for animation to finish
    setTimeout(() => {
      const docRef = doc(db, 'users', user.uid, 'entries', id);
      setArchivesData(prev => prev.filter(item => item.id !== id));
      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
      }
      setDeletingIds(prev => prev.filter(delId => delId !== id));
      
      // Background client-side deletion
      void deleteDoc(docRef).catch(err => console.error('Background delete failed', err));
    }, 800);
  };`;

code = code.replace(oldDeleteEntryStr, newDeleteEntryStr);

const startStr = '  const removeMessage = async (entryId: string, messageIndex: number, e: React.MouseEvent) => {';
const endStr = '    }, 1000);\n  };';

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const newRemoveMessage = `  const removeMessage = async (entryId: string, messageIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !selectedEntry) return;
    
    // Trigger Ink Bleed Animation
    setBurningMessages(prev => [...prev, messageIndex]);
    
    setTimeout(() => {
      setBurningMessages(prev => prev.filter(idx => idx !== messageIndex));
      
      const transcript = [...selectedEntry.transcript];
      const targetMessage = transcript[messageIndex];
      let startIdx = messageIndex;
      let count = 1;
      
      // Only delete the specific AI response if requested, leave the preceding user prompt
      if (targetMessage && targetMessage.role === 'user') {
        if (messageIndex + 1 < transcript.length && transcript[messageIndex + 1].role !== 'user') count = 2;
      }
      transcript.splice(startIdx, count);

      // Optimistically update without collapsing the card
      if (transcript.length === 0) {
        setArchivesData(prev => prev.filter(item => item.id !== entryId));
        setSelectedEntry(null);
      } else {
        const optimisticEntry = { ...selectedEntry, transcript };
        setSelectedEntry(optimisticEntry);
        setArchivesData(prev => prev.map(item => item.id === entryId ? optimisticEntry : item));
      }

      // Background network sync
      void (async () => {
        try {
          const docRef = doc(db, 'users', user.uid, 'entries', entryId);
          if (transcript.length === 0) {
            await deleteDoc(docRef);
            return;
          }
          
          await updateDoc(docRef, { transcript });

          // Request new summary from the backend
          const token = await auth.currentUser?.getIdToken();
          const response = await fetch('/api/journal/summarize', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': \`Bearer \${token}\`
            },
            body: JSON.stringify({ transcript })
          });

          if (!response.ok) throw new Error("Failed to summarize updated transcript");
          
          const data = await response.json();
          const freshData = {
            title: data.summary.title,
            summary: data.summary.summary,
            mood: data.summary.mood,
            tags: data.summary.tags,
            transcript: data.transcript,
            embedding: vector(data.vector || [])
          };
          
          await updateDoc(docRef, freshData);
          
          // Apply authoritative backend state
          setArchivesData(prevArchives => 
            prevArchives.map(entry => {
              if (entry.id === entryId) {
                const finalEntry = { ...entry, ...freshData };
                if (selectedEntry?.id === entryId) {
                  setSelectedEntry(finalEntry);
                }
                return finalEntry;
              }
              return entry;
            })
          );
        } catch (error: any) {
          console.error("Omit failed:", error);
        }
      })();
    }, 1000);
  };`;

  code = code.substring(0, startIndex) + newRemoveMessage + code.substring(endIndex + endStr.length);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Updated App.tsx fully to bypass backend DB writes");
} else {
  console.log("Could not find start or end index for removeMessage");
}
