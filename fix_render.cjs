const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const renderMessageFunc = `
  const renderMessage = (text: string) => {
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
  };

`;

// Insert renderMessage before handleSend
const handleSendIndex = code.indexOf('const handleSend = async () => {');
code = code.slice(0, handleSendIndex) + renderMessageFunc + code.slice(handleSendIndex);

// Replace the inline logic
const oldRender = `{msg.content.split(/(\\[Erase this echo\\]\\(forget:[a-zA-Z0-9_-]+\\))/g).map((part, i) => {
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
                            })}`;

const newRender = `{renderMessage(msg.content)}`;

code = code.replace(oldRender, newRender);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated');
