const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const newArchive = `const handleArchiveAndClear = async () => {
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
  
code = code.replace(/const handleArchiveAndClear = async \(\) => \{[\s\S]*?\}\s*?\};\s*\n/, newArchive + '\n');


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
code = code.replace(/const deleteEntry = async \(id: string, e: React\.MouseEvent\) => \{[\s\S]*?console\.error\('Failed to delete entry', err\);\n    \}\n  \};\n/, newDeleteEntry + '\n');


const newRemoveMessage = `const removeMessage = async (entryId: string, messageIndex: number, e: React.MouseEvent) => {
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
code = code.replace(/const removeMessage = async \(entryId: string, messageIndex: number, e: React\.MouseEvent\) => \{[\s\S]*?finally \{\n      setIsRewritingMemory\(false\);\n    \}\n  \};\n/, newRemoveMessage + '\n');

fs.writeFileSync('src/App.tsx', code);
console.log('Restored frontend fetch calls to API routes');
