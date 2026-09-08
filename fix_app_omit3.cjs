const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const startStr = '  const removeMessage = async (entryId: string, messageIndex: number, e: React.MouseEvent) => {';
const endStr = '    }, 250);\n};';

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const newRemove = `  const removeMessage = async (entryId: string, messageIndex: number, e: React.MouseEvent) => {
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
      
      if (targetMessage && targetMessage.role === 'user') {
        if (messageIndex + 1 < transcript.length && transcript[messageIndex + 1].role !== 'user') count = 2;
      } else if (targetMessage && targetMessage.role !== 'user') {
        if (messageIndex - 1 >= 0 && transcript[messageIndex - 1].role === 'user') {
          startIdx = messageIndex - 1;
          count = 2;
        }
      }
      transcript.splice(startIdx, count);

      // Optimistically update without collapsing the card
      const optimisticEntry = { ...selectedEntry, transcript };
      setSelectedEntry(optimisticEntry);
      setArchivesData(prev => prev.map(item => item.id === entryId ? optimisticEntry : item));

      // Background network sync
      void (async () => {
        try {
          const token = await auth.currentUser?.getIdToken();
          const response = await fetch(\`/api/journal/entries/\${entryId}/omit\`, {
            method: 'PATCH',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': \`Bearer \${token}\`
            },
            body: JSON.stringify({ messageIndex })
          });

          if (!response.ok) throw new Error("Failed to omit message pair");
          const updatedEntry = await response.json();

          // Safely apply authoritative backend state
          setArchivesData(prevArchives => 
            prevArchives.map(entry => {
              if (entry.id === entryId) {
                const finalEntry = updatedEntry.transcript ? updatedEntry : { ...entry, transcript: transcript };
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
    }, 250);
  };`;

  code = code.substring(0, startIndex) + newRemove + code.substring(endIndex + endStr.length);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Updated App.tsx removeMessage successfully!");
} else {
  console.log("Still could not find start or end index", startIndex, endIndex);
}
