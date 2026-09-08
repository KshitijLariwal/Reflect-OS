const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldRender = `  const renderMessage = (text: string) => {
    return text.split(/(\\[Erase this echo\\]\\(forget:[a-zA-Z0-9_-]+\\))/g).map((part, i) => {
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
    });
  };`;

const newRender = `  const renderMessage = (text: string) => {
    if (!text) return null;
    return text.split(/(\\[Erase this echo\\]\\(forget:[a-zA-Z0-9_-]+\\))/g).map((part, i) => {
      const match = part.match(/\\[Erase this echo\\]\\(forget:([a-zA-Z0-9_-]+)\\)/);
      if (match) {
        const memoryId = match[1];
        return (
          <button
            key={i}
            onClick={() => forgetMemory(memoryId)}
            className="ml-2 px-2 py-1 bg-red-900/20 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/40 rounded cursor-pointer inline-block transition-colors"
            title="Permanently erase this memory context"
          >
            [Erase this echo]
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };`;

code = code.replace(oldRender, newRender);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated');
