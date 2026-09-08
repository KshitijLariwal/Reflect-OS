const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add isArchiving state
code = code.replace(
  '  const [isSending, setIsSending] = useState(false);',
  '  const [isSending, setIsSending] = useState(false);\n  const [isArchiving, setIsArchiving] = useState(false);'
);

// Update handleArchiveAndClear
const oldHandleArchive = `  const handleArchiveAndClear = async () => {
    if (!user) return;
    if (chatHistory.length === 0) {
      alert("No whispers to archive yet.");
      return;
    }
    if (isSending) return;
    setIsSending(true);
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
      
      const data = await response.json();
      if (response.ok && data.success) {
        
        // Save the generated summary and vector to Firestore client-side
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
    } catch (err) {
      console.error("Archive flow error:", err);
      alert("Failed to bind to archives.");
    } finally {
      setIsSending(false);
    }
  };`;

const newHandleArchive = `  const handleArchiveAndClear = async () => {
    if (!user) { alert("Auth Error: You must be logged in to archive."); return; }
    if (chatHistory.length === 0) {
      alert("No whispers to archive yet.");
      return;
    }
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
        // Save the generated summary and vector to Firestore client-side
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
    } catch (err) {
      console.error("Archive flow error:", err);
      alert("Failed to bind to archives.");
    } finally {
      setIsArchiving(false);
    }
  };`;
  
code = code.replace(oldHandleArchive, newHandleArchive);

// Update button UI
const oldButtonUI = `<button 
                    className="w-full text-left px-4 py-3 text-sm font-serif text-[#143026] hover:bg-white/40 transition-colors disabled:opacity-50"
                    onClick={() => {
                      handleArchiveAndClear();
                    }}
                    disabled={isSending || chatHistory.length === 0}
                  >
                    Bind to Archives 📜
                  </button>`;
                  
const newButtonUI = `<button 
                    className="w-full text-left px-4 py-3 text-sm font-serif text-[#143026] hover:bg-white/40 transition-colors disabled:opacity-50"
                    onClick={() => {
                      handleArchiveAndClear();
                    }}
                    disabled={isArchiving || chatHistory.length === 0}
                  >
                    {isArchiving ? "Saving..." : "Bind to Archives 📜"}
                  </button>`;
                  
code = code.replace(oldButtonUI, newButtonUI);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx archive handler updated');
