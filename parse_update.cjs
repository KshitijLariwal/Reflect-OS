const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Update chatHistory type
code = code.replace(
  "const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([]);",
  "const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant' | 'system', content: string}[]>([]);"
);

// 2. Add forgetMemory function inside App component
const fetchArchivesStr = `  const fetchArchives = async () => {`;
const forgetMemoryStr = `  const forgetMemory = async (id: string) => {
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
        setChatHistory(prev => [...prev, { role: 'system', content: 'The pages have been burned. This memory will no longer echo.' }]);
      }
    } catch (err) {
      console.error('Failed to forget memory', err);
    }
  };

  const fetchArchives = async () => {`;
code = code.replace(fetchArchivesStr, forgetMemoryStr);

// 3. Add parsing logic and update rendering
const renderTarget = `                        {msg.role === 'user' ? (
                          <div 
                            className="text-base leading-relaxed text-[#2c2822] bg-[#dfd6c2] px-5 py-3 rounded-2xl rounded-tr-sm max-w-[75%] self-end text-left shadow-sm"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif", textTransform: 'none', letterSpacing: 'normal', fontVariant: 'normal', overflowWrap: 'break-word', wordBreak: 'normal', whiteSpace: 'pre-wrap' }}
                          >
                            {msg.content}
                          </div>
                        ) : (
                          <div 
                            className="text-lg leading-loose text-[#143026] text-left max-w-[90%]"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif", textTransform: 'none', letterSpacing: 'normal', fontVariant: 'normal', overflowWrap: 'break-word', wordBreak: 'normal', whiteSpace: 'pre-wrap' }}
                          >
                            {msg.content}
                          </div>
                        )}`;

const renderReplacement = `                        {msg.role === 'user' ? (
                          <div 
                            className="text-base leading-relaxed text-[#2c2822] bg-[#dfd6c2] px-5 py-3 rounded-2xl rounded-tr-sm max-w-[75%] self-end text-left shadow-sm"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif", textTransform: 'none', letterSpacing: 'normal', fontVariant: 'normal', overflowWrap: 'break-word', wordBreak: 'normal', whiteSpace: 'pre-wrap' }}
                          >
                            {msg.content}
                          </div>
                        ) : msg.role === 'system' ? (
                          <div className="text-xs italic text-red-800/70 text-center w-full my-2 font-serif tracking-wide w-full" style={{ width: '100%' }}>
                             {msg.content}
                          </div>
                        ) : (
                          <div 
                            className="text-lg leading-loose text-[#143026] text-left max-w-[90%]"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif", textTransform: 'none', letterSpacing: 'normal', fontVariant: 'normal', overflowWrap: 'break-word', wordBreak: 'normal', whiteSpace: 'pre-wrap' }}
                          >
                            {msg.content.split(/(\\[Erase this echo\\]\\(forget:[a-zA-Z0-9_-]+\\))/g).map((part, i) => {
                              const match = part.match(/\\[Erase this echo\\]\\(forget:([a-zA-Z0-9_-]+)\\)/);
                              if (match) {
                                return (
                                  <span 
                                    key={i}
                                    onClick={() => forgetMemory(match[1])}
                                    className="text-red-800/70 hover:text-red-600 cursor-pointer text-xs underline inline-block ml-2 font-sans tracking-widest uppercase transition-colors"
                                  >
                                    [Erase this echo]
                                  </span>
                                );
                              }
                              return <span key={i}>{part}</span>;
                            })}
                          </div>
                        )}`;

code = code.replace(renderTarget, renderReplacement);

// We should also fix className for motion.div so system messages center correctly
const flexTarget = "className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}";
const flexReplacement = "className={`flex ${msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'}`}";
code = code.replace(flexTarget, flexReplacement);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated');
