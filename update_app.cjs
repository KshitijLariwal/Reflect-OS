const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Update archiveConversation / handleArchiveAndClear
const archiveRegex = /const handleArchiveAndClear = async \(\) => \{[\s\S]*?\}\s*?\};\s*\n/g;
const newArchive = `const handleArchiveAndClear = async () => {
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
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        alert(errorText);
        return;
      }

      const data = await response.json();
      if (data.success) {
        const entriesRef = collection(db, 'users', user.uid, 'entries');
        await addDoc(entriesRef, {
          ...data.summary,
          transcript: data.transcript,
          embedding: vector(data.vector),
          createdAt: serverTimestamp()
        });

        alert("Whispers successfully bound to the archives! 📜");
        setChatHistory([]);
        setMoodData({
          insight: 'The spirit, poised at the threshold of expression, seeks its proper channel.',
          colors: ['#e2e8f0', '#fef08a', '#fdf8ff', '#f1f5f9'],
          concepts: ['Anticipation', 'New Beginning', 'Reflection', 'Silence']
        });
      }
    } catch (err: any) {
      console.error("Archive flow error:", err);
      alert(err.message || "Failed to bind to archives.");
    } finally {
      setIsArchiving(false);
    }
  };
`;
code = code.replace(archiveRegex, newArchive);

// Button JSX update
code = code.replace(
  `onClick={() => {\n                      handleArchiveAndClear();\n                    }}`,
  `type="button"\n                    onClick={(e) => {\n                      e.preventDefault();\n                      handleArchiveAndClear();\n                    }}`
);

// renderMessage update
const renderMsgRegex = /const renderMessage = \(text: string\) => \{[\s\S]*?return text;\n  \};/g;
const newRenderMsg = `const renderMessage = (text: string) => {
    if (!text) return null;
    const regex = /(\\[Erase this echo\\]\\(forget:[a-zA-Z0-9_-]+\\))/g;
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      const match = part.match(/\\[Erase this echo\\]\\(forget:([a-zA-Z0-9_-]+)\\)/);
      if (match) {
        return (
          <button 
            key={index} 
            type="button" 
            onClick={() => forgetMemory(match[2])} 
            className="ml-2 text-xs text-red-500 hover:text-red-400 underline cursor-pointer"
          >
            [Erase this echo]
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };`;
code = code.replace(renderMsgRegex, newRenderMsg);

// For the Delete and Omit button inside Archives Modal
const removeMsgRegex = /const removeMessage = async \(entryId: string, messageIndex: number, e: React\.MouseEvent\) => \{[\s\S]*?finally \{\n      setIsRewritingMemory\(false\);\n    \}\n  \};/g;
const newRemoveMsg = `const removeMessage = async (entryId: string, messageIndex: number, e: React.MouseEvent) => {
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
      
      if (!response.ok) {
        console.error(await response.text());
        return;
      }
      
      const updatedEntry = await response.json();
      if (updatedEntry.deleted) {
        setArchivesData(prev => prev.filter(item => item.id !== entryId));
        setSelectedEntry(null);
      } else {
        setArchivesData(prev => prev.map(item => item.id === entryId ? updatedEntry : item));
        setSelectedEntry(updatedEntry);
      }
    } catch (err) {
      console.error('Failed to omit message:', err);
    } finally {
      setIsRewritingMemory(false);
    }
  };`;
code = code.replace(removeMsgRegex, newRemoveMsg);

const deleteEntryRegex = /const deleteEntry = async \(id: string, e: React\.MouseEvent\) => \{[\s\S]*?console\.error\('Failed to delete entry', err\);\n    \}\n  \};/g;
const newDeleteEntry = `const deleteEntry = async (id: string, e: React.MouseEvent) => {
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
code = code.replace(deleteEntryRegex, newDeleteEntry);

// Class updates for omit/delete buttons
code = code.replace(
  `className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-opacity p-1 flex-shrink-0"`,
  `className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-opacity p-1 flex-shrink-0 relative z-10 cursor-pointer pointer-events-auto"`
);

code = code.replace(
  `className="absolute top-4 right-4 text-[#7a3e3e]/50 hover:text-[#7a3e3e] opacity-0 group-hover:opacity-100 hover:bg-[#7a3e3e]/10 p-1.5 rounded-md transition-all z-10"`,
  `className="absolute top-4 right-4 text-[#7a3e3e]/50 hover:text-[#7a3e3e] opacity-0 group-hover:opacity-100 hover:bg-[#7a3e3e]/10 p-1.5 rounded-md transition-all relative z-10 cursor-pointer pointer-events-auto"`
);


fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated');
