const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add deleteEntry function
const fetchArchivesIndex = code.indexOf('const fetchArchives = async () => {');
const deleteEntryFunc = `const deleteEntry = async (id: string, e: React.MouseEvent) => {
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
        setArchivesData(prev => prev.filter(entry => entry.id !== id));
        // If the currently viewed entry is deleted, close it
        if (selectedEntry?.id === id) {
          setSelectedEntry(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete entry', err);
    }
  };

  `;

code = code.slice(0, fetchArchivesIndex) + deleteEntryFunc + code.slice(fetchArchivesIndex);

// 2. Add delete button to archive card
const renderTarget = `                archivesData.map((entry) => (
                  <div key={entry.id} className="bg-white/40 rounded-xl p-5 border border-[#143026]/5 shadow-sm hover:shadow-md hover:bg-white/60 transition-all cursor-pointer" onClick={() => setSelectedEntry(entry)}>
                    <div className="flex flex-col lg:flex-row justify-between items-start mb-3 gap-2 lg:gap-0">`;

const renderReplacement = `                archivesData.map((entry) => (
                  <div key={entry.id} className="bg-white/40 rounded-xl p-5 border border-[#143026]/5 shadow-sm hover:shadow-md hover:bg-white/60 transition-all cursor-pointer relative group" onClick={() => setSelectedEntry(entry)}>
                    <button
                      onClick={(e) => deleteEntry(entry.id, e)}
                      className="absolute top-4 right-4 text-[#7a3e3e]/50 hover:text-[#7a3e3e] opacity-0 group-hover:opacity-100 hover:bg-[#7a3e3e]/10 p-1.5 rounded-md transition-all z-10"
                      title="Delete Entry"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                    <div className="flex flex-col lg:flex-row justify-between items-start mb-3 gap-2 lg:gap-0 pr-8">`;

code = code.replace(renderTarget, renderReplacement);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated');
