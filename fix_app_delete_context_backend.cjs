const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldBackendState = `          // Safely apply authoritative backend state
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
          );`;

const newBackendState = `          // Safely apply authoritative backend state
          if (updatedEntry.deleted) {
             setArchivesData(prev => prev.filter(item => item.id !== entryId));
             if (selectedEntry?.id === entryId) setSelectedEntry(null);
          } else {
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
          }`;

if (code.includes(oldBackendState)) {
  code = code.replace(oldBackendState, newBackendState);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Updated App.tsx backend state application");
} else {
  console.log("Could not find backend state application block");
}
