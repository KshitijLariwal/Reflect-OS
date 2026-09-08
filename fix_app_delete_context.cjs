const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const optimisticEntry = \{ \.\.\.selectedEntry, transcript \};\n      setSelectedEntry\(optimisticEntry\);\n      setArchivesData\(prev => prev\.map\(item => item\.id === entryId \? optimisticEntry : item\)\);/g;

const replacement = `      if (transcript.length === 0) {
        setArchivesData(prev => prev.filter(item => item.id !== entryId));
        setSelectedEntry(null);
      } else {
        const optimisticEntry = { ...selectedEntry, transcript };
        setSelectedEntry(optimisticEntry);
        setArchivesData(prev => prev.map(item => item.id === entryId ? optimisticEntry : item));
      }`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Updated App.tsx to delete entry when transcript is empty");
} else {
  console.log("Could not find optimistic update block");
}

