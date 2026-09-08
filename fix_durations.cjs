const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace('animation: burnToAsh 0.25s forwards cubic-bezier(0.4, 0, 0.2, 1);', 'animation: burnToAsh 0.8s forwards cubic-bezier(0.4, 0, 0.2, 1);');
css = css.replace('animation: inkBleed 0.25s forwards ease-in-out;', 'animation: inkBleed 1s forwards ease-in-out;');
fs.writeFileSync('src/index.css', css);

let code = fs.readFileSync('src/App.tsx', 'utf8');

// The deleteEntry timeout
code = code.replace(
  `} else {\n        const optimisticEntry = { ...selectedEntry, transcript };\n        setSelectedEntry(optimisticEntry);\n        setArchivesData(prev => prev.map(item => item.id === entryId ? optimisticEntry : item));\n      }\n      setDeletingIds(prev => prev.filter(delId => delId !== id));\n      \n      // Background unawaited deletion\n      void deleteDoc(docRef).catch(err => console.error('Background delete failed', err));\n    }, 250);`,
  `} else {\n        const optimisticEntry = { ...selectedEntry, transcript };\n        setSelectedEntry(optimisticEntry);\n        setArchivesData(prev => prev.map(item => item.id === entryId ? optimisticEntry : item));\n      }\n      setDeletingIds(prev => prev.filter(delId => delId !== id));\n      \n      // Background unawaited deletion\n      void deleteDoc(docRef).catch(err => console.error('Background delete failed', err));\n    }, 800);`
);

// Wait, the deleteEntry is:
/*
    setTimeout(() => {
      const docRef = doc(db, 'users', user.uid, 'entries', id);
      setArchivesData(prev => prev.filter(item => item.id !== id));
      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
      }
      setDeletingIds(prev => prev.filter(delId => delId !== id));
      
      // Background unawaited deletion
      void deleteDoc(docRef).catch(err => console.error('Background delete failed', err));
    }, 250);
*/
