const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add state
const stateToAdd = `  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [burningMessages, setBurningMessages] = useState<number[]>([]);
`;
code = code.replace(
  'const [isRewritingMemory, setIsRewritingMemory] = useState(false);',
  'const [isRewritingMemory, setIsRewritingMemory] = useState(false);\n' + stateToAdd
);

// Modify deleteEntry
const newDelete = `  const deleteEntry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    // 1. Trigger Animation
    setDeletingIds(prev => [...prev, id]);
    
    // 2. Wait for animation to finish
    setTimeout(async () => {
      try {
        const docRef = doc(db, 'users', user.uid, 'entries', id);
        await deleteDoc(docRef);
        setArchivesData(prev => prev.filter(item => item.id !== id));
        if (selectedEntry?.id === id) {
          setSelectedEntry(null);
        }
      } catch (err) {
        console.error('Failed to delete entry', err);
      } finally {
        setDeletingIds(prev => prev.filter(delId => delId !== id));
      }
    }, 800);
  };`;
code = code.replace(/const deleteEntry = async \(id: string, e: React\.MouseEvent\) => \{[\s\S]*?console\.error\('Failed to delete entry', err\);\n    \}\n  \};\n/, newDelete + '\n');


// Modify removeMessage
const oldRemove = `  const removeMessage = async (entryId: string, messageIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !selectedEntry) return;
    
    setIsRewritingMemory(true);
    try {`;

const newRemove = `  const removeMessage = async (entryId: string, messageIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !selectedEntry) return;
    
    // Trigger Ink Bleed Animation
    setBurningMessages(prev => [...prev, messageIndex]);
    
    setTimeout(async () => {
      setIsRewritingMemory(true);
      try {`;

const oldRemoveCatch = `    } catch (err) {
      console.error('Failed to omit message:', err);
    } finally {
      setIsRewritingMemory(false);
    }
  };`;

const newRemoveCatch = `    } catch (err) {
      console.error('Failed to omit message:', err);
    } finally {
      setIsRewritingMemory(false);
      setBurningMessages(prev => prev.filter(idx => idx !== messageIndex));
    }
  }, 1000);
};`;

code = code.replace(oldRemove, newRemove);
code = code.replace(oldRemoveCatch, newRemoveCatch);

fs.writeFileSync('src/App.tsx', code);
console.log("Added deletion animation states and delays");
